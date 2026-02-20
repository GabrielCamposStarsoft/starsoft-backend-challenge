/**
 * @fileoverview Scheduler for periodically cleaning up processed sales outbox records.
 * Uses a distributed lock to ensure a single instance runs at a time.
 */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLockService } from 'src/common';
import { SalesOutboxCleanupService } from '../services/sales-outbox-cleanup.service';

/**
 * Distributed lock key for the sales outbox cleanup scheduler.
 * Ensures only one process executes the cleanup at a time.
 * @type {string}
 */
const LOCK_KEY: string = 'lock:sales-outbox-cleanup';

/**
 * Time-to-live (TTL) for the distributed lock, in seconds.
 * Should be set higher than the longest expected cleanup time.
 * @type {number}
 */
const LOCK_TTL_SECONDS: number = 25;

/**
 * Scheduler responsible for periodically cleaning up processed sales outbox records
 * that are older than a predefined retention threshold.
 *
 * @class
 */
@Injectable()
export class SalesOutboxCleanupScheduler {
  /**
   * Constructs the SalesOutboxCleanupScheduler.
   *
   * @param {SalesOutboxCleanupService} salesOutboxCleanupService Service handling the actual cleanup of outbox records.
   * @param {DistributedLockService} lockService Service used to acquire and release distributed locks for safe mutual exclusion.
   */
  constructor(
    private readonly salesOutboxCleanupService: SalesOutboxCleanupService,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Cron job handler that deletes processed sales outbox records older than the retention policy.
   *
   * - Runs every hour ({@link CronExpression.EVERY_HOUR}).
   * - Ensures mutual exclusion per cluster via distributed locking.
   * - Delegates cleanup to {@link SalesOutboxCleanupService}.
   *
   * @async
   * @returns {Promise<void>} Resolves when cleanup completes or skips if lock not acquired.
   */
  @Cron(CronExpression.EVERY_HOUR)
  public async handleCleanup(): Promise<void> {
    /**
     * Whether the distributed lock was acquired for the cleanup operation.
     * @type {boolean}
     */
    const isAcquired: boolean = await this.lockService.acquire(
      LOCK_KEY,
      LOCK_TTL_SECONDS,
    );

    if (!isAcquired) {
      return;
    }

    try {
      /**
       * Calls the service responsible for cleaning old processed outbox events.
       */
      await this.salesOutboxCleanupService.cleanup();
    } finally {
      /**
       * Always release the lock after the cleanup operation, even on error.
       */
      await this.lockService.release(LOCK_KEY);
    }
  }
}

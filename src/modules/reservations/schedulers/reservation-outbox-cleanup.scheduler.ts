/**
 * @fileoverview Scheduler for periodically cleaning up published reservation outbox records.
 * This scheduler uses a distributed lock to ensure that only one instance runs cleanup at any given time across the cluster.
 * @scheduler reservation-outbox-cleanup-scheduler
 */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationOutboxCleanupService } from '../services/reservation-outbox-cleanup.service';
import { DistributedLockService } from 'src/common';

/**
 * Distributed lock key used to ensure exclusive cleanup execution across distributed instances.
 * @type {string}
 */
const LOCK_KEY: string = 'lock:reservation-outbox-cleanup';

/**
 * Time-to-live (TTL) for the distributed lock, specified in seconds.
 * Should be equal to or greater than the expected duration of any cleanup job.
 * @type {number}
 */
const LOCK_TTL_SECONDS: number = 25;

/**
 * Scheduler responsible for cleaning up published reservation outbox records older than a retention threshold.
 * Runs on a scheduled basis to periodically remove old, published outbox entries and keep the database healthy.
 *
 * @class
 */
@Injectable()
export class ReservationOutboxCleanupScheduler {
  /**
   * Constructs the cleanup scheduler.
   *
   * @param {ReservationOutboxCleanupService} reservationOutboxCleanupService
   *   The service responsible for deleting qualifying reservation outbox records.
   * @param {DistributedLockService} lockService
   *   Service for acquiring and releasing a distributed lock to prevent concurrent jobs across cluster nodes.
   */
  constructor(
    private readonly reservationOutboxCleanupService: ReservationOutboxCleanupService,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Cron job handler for cleaning up published reservation outbox records past the retention policy.
   *
   * - Runs every hour, as configured by {@link CronExpression.EVERY_HOUR}.
   * - Attempts to acquire a distributed lock before proceeding. If the lock cannot be acquired, the handler exits.
   * - Delegates the actual cleanup to {@link ReservationOutboxCleanupService#cleanup}.
   * - Always releases the distributed lock after the cleanup attempt, regardless of success or error.
   *
   * @returns {Promise<void>} Resolves when cleanup is complete, or if not acquired, immediately.
   */
  @Cron(CronExpression.EVERY_HOUR)
  public async handleCleanup(): Promise<void> {
    /** @type {boolean} Whether the distributed lock was acquired for the cleanup. */
    const isAcquired: boolean = await this.lockService.acquire(
      LOCK_KEY,
      LOCK_TTL_SECONDS,
    );

    // Exit early if unable to acquire distributed lock.
    if (!isAcquired) {
      return;
    }

    try {
      // Call the service method to clean up published outbox records older than the retention threshold.
      await this.reservationOutboxCleanupService.cleanup();
    } finally {
      // Always release the distributed lock, regardless of errors in cleanup logic.
      await this.lockService.release(LOCK_KEY);
    }
  }
}

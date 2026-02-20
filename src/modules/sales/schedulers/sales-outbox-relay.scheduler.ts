/**
 * @fileoverview Scheduler for periodically relaying sales outbox events.
 * Uses a distributed lock to ensure a single instance runs at a time.
 * @scheduler sales-outbox-relay-scheduler
 */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLockService } from 'src/common';
import { RelaySaleOutboxUseCase } from '../use-cases/relay-sale-outbox.use-case';

/**
 * Distributed lock key for the sales outbox relay scheduler.
 * Ensures only one process executes the relay at a time.
 * @type {string}
 */
const LOCK_KEY: string = 'lock:sales-outbox-relay';

/**
 * Time-to-live for the distributed lock, in seconds.
 * Should be greater than longest expected outbox relay time.
 * @type {number}
 */
const LOCK_TTL_SECONDS: number = 25;

/**
 * @class SalesOutboxRelayScheduler
 * @classdesc Scheduler that periodically relays sales outbox events.
 *
 * Relays outbox events to the messaging broker.
 * Runs every 30 seconds and protected by a distributed lock to prevent concurrent executions across distributed instances.
 */
@Injectable()
export class SalesOutboxRelayScheduler {
  /**
   * Create instance of SalesOutboxRelayScheduler.
   *
   * @param relaySaleOutboxUseCase - Use case for relaying sales outbox events.
   * @param lockService - Service for acquiring distributed locks to serialize processing across instances.
   */
  constructor(
    private readonly relaySaleOutboxUseCase: RelaySaleOutboxUseCase,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Cron job handler for relaying sales outbox events.
   *
   * - Triggered every 30 seconds (see {@link CronExpression.EVERY_30_SECONDS}).
   * - Acquires distributed lock prior to processing, so only one instance relays at a time.
   * - Delegates to {@link RelaySaleOutboxUseCase}.
   *
   * @async
   * @returns {Promise<void>} Resolves when relay work completes, or skips if lock not acquired.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  public async handleRelay(): Promise<void> {
    /**
     * Whether the distributed lock was acquired for the relay operation.
     * @type {boolean}
     */
    const isAcquired: boolean = await this.lockService.acquire(
      LOCK_KEY,
      LOCK_TTL_SECONDS,
    );

    if (!isAcquired) {
      /**
       * Lock not acquired; another instance is performing this task.
       */
      return;
    }

    try {
      /**
       * Calls the use case to process and relay pending sales outbox events.
       */
      await this.relaySaleOutboxUseCase.execute();
    } finally {
      /**
       * Always release the lock after finishing, even if an error occurs.
       */
      await this.lockService.release(LOCK_KEY);
    }
  }
}

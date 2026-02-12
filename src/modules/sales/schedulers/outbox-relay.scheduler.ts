/**
 * @fileoverview Scheduler for periodically relaying outbox events related to sales.
 * Uses a distributed lock to ensure a single instance runs at a time.
 */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLockService } from 'src/common';
import { OutboxRelayService } from '../services/outbox-relay.service';

const LOCK_KEY: string = 'lock:outbox-relay';
const LOCK_TTL_SECONDS: number = 25;

/**
 * Scheduler class for periodically relaying outbox events related to sales.
 */
@Injectable()
export class OutboxRelayScheduler {
  /**
   * Constructs the OutboxRelayScheduler.
   * @param outboxRelayService The service that processes pending outbox events.
   * @param lockService The distributed lock service used to ensure exclusive relay execution.
   */
  constructor(
    private readonly outboxRelayService: OutboxRelayService,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Cron job that runs every 30 seconds to process pending outbox events.
   * This method acquires a distributed lock before processing to prevent concurrent executions.
   * If the lock is not acquired, the method returns early.
   * @returns {Promise<void>} Resolves when job completes or lock not acquired.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  public async handleRelay(): Promise<void> {
    /** @type {boolean} Whether the distributed lock was successfully acquired */
    const isAcquired: boolean = await this.lockService.acquire(
      LOCK_KEY,
      LOCK_TTL_SECONDS,
    );

    if (!isAcquired) {
      return;
    }

    try {
      /**
       * Process all pending outbox events.
       * Delegation to {@link OutboxRelayService.processPendingEvents}
       */
      await this.outboxRelayService.processPendingEvents();
    } finally {
      /** Always release the lock after processing, even if an error occurs. */
      await this.lockService.release(LOCK_KEY);
    }
  }
}

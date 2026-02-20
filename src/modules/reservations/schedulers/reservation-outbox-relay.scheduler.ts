/**
 * @fileoverview Scheduler for periodically relaying reservation outbox events.
 * Uses a distributed lock to ensure a single instance runs at a time.
 * @scheduler reservation-outbox-relay-scheduler
 */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLockService } from 'src/common';
import {
  RelayReservationCreatedOutboxUseCase,
  RelayReservationExpirationOutboxUseCase,
} from '../use-cases';

/**
 * Distributed lock key for the outbox relay scheduler.
 * Ensures only one process executes the relay at a time.
 * @type {string}
 */
const LOCK_KEY: string = 'lock:reservation-outbox-relay';

/**
 * Time-to-live for the distributed lock, in seconds.
 * Should be greater than longest expected outbox relay time.
 * @type {number}
 */
const LOCK_TTL_SECONDS: number = 25;

/**
 * @class ReservationOutboxRelayScheduler
 * @classdesc Scheduler that periodically relays reservation outbox events.
 *
 * Relays both "reservation created" and "reservation expiration" outbox events to their targets.
 * Runs every 30 seconds and protected by a distributed lock to prevent concurrent executions across distributed instances.
 */
@Injectable()
export class ReservationOutboxRelayScheduler {
  /**
   * Create instance of ReservationOutboxRelayScheduler.
   *
   * @param relayReservationCreatedOutboxUseCase - Use case for relaying created reservation events.
   * @param relayReservationExpirationOutboxUseCase - Use case for relaying reservation expiration events.
   * @param lockService - Service for acquiring distributed locks to serialize processing across instances.
   */
  constructor(
    private readonly relayReservationCreatedOutboxUseCase: RelayReservationCreatedOutboxUseCase,
    private readonly relayReservationExpirationOutboxUseCase: RelayReservationExpirationOutboxUseCase,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Cron job handler for relaying reservation outbox events.
   *
   * - Triggered every 30 seconds (see {@link CronExpression.EVERY_30_SECONDS}).
   * - Acquires distributed lock prior to processing, so only one instance relays at a time.
   * - Delegates to {@link RelayReservationCreatedOutboxUseCase} and {@link RelayReservationExpirationOutboxUseCase}.
   *
   * @async
   * @returns {Promise<void>} Resolves when relay work completes, or skips if lock not acquired.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  public async handleRelay(): Promise<void> {
    const isAcquired = await this.lockService.acquire(
      LOCK_KEY,
      LOCK_TTL_SECONDS,
    );

    if (!isAcquired) {
      return;
    }

    try {
      await this.relayReservationCreatedOutboxUseCase.execute();
      await this.relayReservationExpirationOutboxUseCase.execute();
    } finally {
      await this.lockService.release(LOCK_KEY);
    }
  }
}

/**
 * @fileoverview Scheduler for periodically expiring reservations.
 * Uses a distributed lock to ensure a single instance runs at a time.
 */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLockService } from 'src/common';
import { ExpireReservationsUseCase } from '../use-cases';

/**
 * Distributed lock key used to guard the expiration cron job.
 * @type {string}
 */
const LOCK_KEY: string = 'lock:reservation-expiration';

/**
 * Time-to-live for the distributed lock, in seconds.
 * Should be longer than the maximum expected job duration.
 * @type {number}
 */
const LOCK_TTL_SECONDS: number = 8;

/**
 * @class ReservationsExpirationScheduler
 * @classdesc Scheduler responsible for periodically expiring reservations.
 *
 * Runs every 10 seconds to help ensure reservations are expired and seats released
 * quickly (30s TTL for reservations, so a 10s interval keeps processing window within ~40s total).
 *
 * Uses DistributedLockService explicitly instead of decorators because NestJS
 * interceptors do not apply to @Cron handlers (only HTTP/microservice requests).
 */
@Injectable()
export class ReservationsExpirationScheduler {
  /**
   * Creates an instance of the scheduler.
   * @param {ExpireReservationsUseCase} expireReservationsUseCase - Use case to execute expiration logic.
   * @param {DistributedLockService} lockService - Distributed lock service to protect the job (prevent concurrency across instances).
   */
  constructor(
    private readonly expireReservationsUseCase: ExpireReservationsUseCase,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Cron handler to process and expire reservations that have exceeded their TTL.
   *
   * Scheduled to run every 10 seconds.
   * Secured by a distributed lock (only one process can run expiration at a time).
   *
   * @async
   * @returns {Promise<void>} Resolves when the expiration process completes or is skipped if lock not acquired.
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  public async handleExpiration(): Promise<void> {
    /**
     * Acquire distributed lock before proceeding.
     * @type {boolean}
     */
    const isAcquired: boolean = await this.lockService.acquire(
      LOCK_KEY,
      LOCK_TTL_SECONDS,
    );

    /**
     * Skip if unable to acquire lock (another instance is running).
     * @type {boolean}
     */
    if (!isAcquired) {
      return;
    }

    try {
      /**
       * Run the use case logic to expire reservations and release seats.
       */
      await this.expireReservationsUseCase.execute();
    } finally {
      /**
       * Always release the distributed lock afterwards.
       */
      await this.lockService.release(LOCK_KEY);
    }
  }
}

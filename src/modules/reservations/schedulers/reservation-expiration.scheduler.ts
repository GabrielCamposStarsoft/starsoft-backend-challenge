import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLock } from 'src/common';
import { ExpireReservationsUseCase } from '../use-cases';

/**
 * Scheduler responsible for handling the periodic expiration of reservations.
 *
 * Runs every 10 seconds to meet the 30s SLA: reservations have a 30s TTL, so
 * processing them within 10s keeps total time to release seats within ~40s.
 */
@Injectable()
export class ReservationsExpirationScheduler {
  /**
   * Constructs the ReservationsExpirationScheduler.
   *
   * @param expireReservationsUseCase - The use case handling reservation expiration business logic.
   */
  constructor(
    private readonly expireReservationsUseCase: ExpireReservationsUseCase,
  ) {}

  /**
   * Cron job handler that processes expired reservations.
   *
   * Invoked every 10 seconds; protected by a distributed lock so only one instance runs at a time.
   * Delegates expiration logic to ExpireReservationsUseCase.
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  @DistributedLock('lock:reservation-expiration', 8)
  public async handleExpiration(): Promise<void> {
    await this.expireReservationsUseCase.execute();
  }
}

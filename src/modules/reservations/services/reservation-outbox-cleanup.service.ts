/**
 * @fileoverview Reservation outbox cleanup service.
 *
 * Delegates cleanup logic to CleanReservationOutboxUseCase.
 *
 * @service reservation-outbox-cleanup-service
 */
import { Injectable } from '@nestjs/common';
import { CleanReservationOutboxUseCase } from '../use-cases/clean-reservation-outbox.use-case';

/**
 * Service responsible for cleaning up published outbox records.
 * Thin orchestrator that delegates to CleanReservationOutboxUseCase.
 */
@Injectable()
export class ReservationOutboxCleanupService {
  constructor(
    private readonly cleanReservationOutboxUseCase: CleanReservationOutboxUseCase,
  ) {}

  /**
   * Deletes published outbox entries older than the retention threshold.
   *
   * @returns Total number of deleted entries.
   */
  public async cleanup(): Promise<number> {
    return this.cleanReservationOutboxUseCase.execute();
  }
}

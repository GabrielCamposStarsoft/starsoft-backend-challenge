/**
 * @fileoverview Use case for cleaning up published reservation outbox records.
 *
 * Deletes entries from reservation_events_outbox and reservation_expiration_outbox
 * where published = true and createdAt is older than the retention threshold.
 *
 * @usecase clean-reservation-outbox-use-case
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import type { IUseCase } from 'src/common';
import {
  ReservationOutboxEntity,
  ReservationExpirationOutboxEntity,
} from '../entities';

/** Retention period in days for published outbox records. */
const RETENTION_DAYS = 7;

@Injectable()
export class CleanReservationOutboxUseCase implements IUseCase<void, number> {
  private readonly logger = new Logger(CleanReservationOutboxUseCase.name);

  constructor(
    @InjectRepository(ReservationOutboxEntity)
    private readonly reservationOutboxRepository: Repository<ReservationOutboxEntity>,
    @InjectRepository(ReservationExpirationOutboxEntity)
    private readonly expirationOutboxRepository: Repository<ReservationExpirationOutboxEntity>,
  ) {}

  /**
   * Deletes published outbox entries older than the retention period.
   *
   * @returns Total number of deleted rows (reservation + expiration outbox).
   */
  public async execute(): Promise<number> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - RETENTION_DAYS);

    const criteria = {
      published: true,
      createdAt: LessThan(retentionDate),
    } as const;

    const [reservationResult, expirationResult] = await Promise.all([
      this.reservationOutboxRepository.delete(criteria),
      this.expirationOutboxRepository.delete(criteria),
    ]);

    const totalDeleted =
      (reservationResult.affected ?? 0) + (expirationResult.affected ?? 0);

    if (totalDeleted > 0) {
      this.logger.log(
        `Cleaned up ${totalDeleted} published outbox entries (reservation: ${reservationResult.affected ?? 0}, expiration: ${expirationResult.affected ?? 0})`,
      );
    }

    return totalDeleted;
  }
}

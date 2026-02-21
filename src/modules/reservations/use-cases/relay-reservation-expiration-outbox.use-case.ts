/**
 * @fileoverview Use case for relaying reservation expiration outbox events to the messaging broker.
 *
 * @usecase relay-reservation-expiration-outbox-use-case
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import type { IUseCase } from 'src/common';
import { ReservationExpirationOutboxEntity } from '../entities';
import {
  BATCH_SIZE,
  BASE_RETRY_DELAY_MS,
  MAX_RETRY_COUNT,
  MAX_RETRY_DELAY_MS,
} from '../constants';

@Injectable()
export class RelayReservationExpirationOutboxUseCase implements IUseCase<
  void,
  number
> {
  private readonly logger: Logger = new Logger(
    RelayReservationExpirationOutboxUseCase.name,
  );

  constructor(
    @InjectRepository(ReservationExpirationOutboxEntity)
    private readonly expirationOutboxRepository: Repository<ReservationExpirationOutboxEntity>,
    private readonly messagingProducer: MessagingProducer,
  ) {}

  /**
   * Processes pending expiration outbox rows: publishes ReservationExpired and
   * optionally SeatReleased, then marks as published.
   */
  public async execute(): Promise<number> {
    const now = new Date();
    const pending = await this.expirationOutboxRepository.find({
      where: [
        {
          published: false,
          retryCount: LessThan(MAX_RETRY_COUNT),
          nextRetryAt: IsNull(),
        },
        {
          published: false,
          retryCount: LessThan(MAX_RETRY_COUNT),
          nextRetryAt: LessThanOrEqual(now),
        },
      ],
      order: { createdAt: 'ASC' },
      take: BATCH_SIZE,
    });

    let processedCount = 0;

    for (const row of pending) {
      try {
        const reason: string = row.reason ?? 'expired';
        if (reason === 'expired') {
          await this.messagingProducer.publishReservationExpired({
            reservationId: row.reservationId,
            seatId: row.seatId,
            sessionId: row.sessionId,
          });
        }
        if (row.seatReleased) {
          await this.messagingProducer.publishSeatReleased({
            reservationId: row.reservationId,
            seatId: row.seatId,
            sessionId: row.sessionId,
            reason: reason as 'expired' | 'cancelled',
          });
        }
        await this.expirationOutboxRepository.update(
          { id: row.id },
          { published: true },
        );
        processedCount += 1;
      } catch (err) {
        const delay = Math.min(
          BASE_RETRY_DELAY_MS * Math.pow(2, row.retryCount),
          MAX_RETRY_DELAY_MS,
        );
        const nextRetryAt = new Date(Date.now() + delay);
        await this.expirationOutboxRepository.update(
          { id: row.id },
          { retryCount: row.retryCount + 1, nextRetryAt },
        );
        this.logger.warn(
          `Failed to relay expiration outbox ${row.id}, retry ${row.retryCount + 1}/${MAX_RETRY_COUNT} in ${delay / 1000}s: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (processedCount > 0) {
      this.logger.log(
        `Relayed ${processedCount} reservation expiration outbox events`,
      );
    }

    return processedCount;
  }
}

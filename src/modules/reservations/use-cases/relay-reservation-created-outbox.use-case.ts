/**
 * @fileoverview Use case for relaying reservation created outbox events to the messaging broker.
 *
 * @usecase relay-reservation-created-outbox-use-case
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import type { IUseCase } from 'src/common';
import { ReservationOutboxEntity } from '../entities';
import {
  BATCH_SIZE,
  BASE_RETRY_DELAY_MS,
  MAX_RETRY_COUNT,
  MAX_RETRY_DELAY_MS,
} from '../constants';

@Injectable()
export class RelayReservationCreatedOutboxUseCase implements IUseCase<
  void,
  number
> {
  private readonly logger: Logger = new Logger(
    RelayReservationCreatedOutboxUseCase.name,
  );

  constructor(
    @InjectRepository(ReservationOutboxEntity)
    private readonly reservationOutboxRepository: Repository<ReservationOutboxEntity>,
    private readonly messagingProducer: MessagingProducer,
  ) {}

  public async execute(): Promise<number> {
    const now = new Date();
    const pending = await this.reservationOutboxRepository.find({
      where: [
        { published: false, retryCount: LessThan(MAX_RETRY_COUNT), nextRetryAt: IsNull() },
        { published: false, retryCount: LessThan(MAX_RETRY_COUNT), nextRetryAt: LessThanOrEqual(now) },
      ],
      order: { createdAt: 'ASC' },
      take: BATCH_SIZE,
    });

    let processedCount = 0;

    for (const row of pending) {
      try {
        await this.messagingProducer.publishReservationCreated({
          reservationId: row.reservationId,
          sessionId: row.sessionId,
          seatId: row.seatId,
          userId: row.userId,
          expiresAt: row.expiresAt,
        });
        await this.reservationOutboxRepository.update(
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
        await this.reservationOutboxRepository.update(
          { id: row.id },
          { retryCount: row.retryCount + 1, nextRetryAt },
        );
        this.logger.warn(
          `Failed to relay reservation outbox ${row.id}, retry ${row.retryCount + 1}/${MAX_RETRY_COUNT} in ${delay / 1000}s: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (processedCount > 0) {
      this.logger.log(`Relayed ${processedCount} reservation outbox events`);
    }

    return processedCount;
  }
}

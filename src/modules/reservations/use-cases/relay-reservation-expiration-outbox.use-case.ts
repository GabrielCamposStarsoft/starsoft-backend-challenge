import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import type { IUseCase } from 'src/common';
import { ReservationExpirationOutboxEntity } from '../entities';
import { BATCH_SIZE } from '../constants';

@Injectable()
export class RelayReservationExpirationOutboxUseCase implements IUseCase<
  void,
  number
> {
  private readonly logger = new Logger(
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
    const pending = await this.expirationOutboxRepository.find({
      where: { published: false },
      order: { createdAt: 'ASC' },
      take: BATCH_SIZE,
    });

    let processedCount = 0;

    for (const row of pending) {
      try {
        await this.messagingProducer.publishReservationExpired({
          reservationId: row.reservationId,
          seatId: row.seatId,
          sessionId: row.sessionId,
        });
        if (row.seatReleased) {
          await this.messagingProducer.publishSeatReleased({
            seatId: row.seatId,
            sessionId: row.sessionId,
            reason: 'expired',
          });
        }
        await this.expirationOutboxRepository.update(
          { id: row.id },
          { published: true },
        );
        processedCount += 1;
      } catch (err) {
        this.logger.warn(
          `Failed to relay expiration outbox ${row.id}: ${err instanceof Error ? err.message : String(err)}`,
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

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import type { IUseCase } from 'src/common';
import { ReservationOutboxEntity } from '../entities';
import { BATCH_SIZE } from '../constants';

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
    const pending = await this.reservationOutboxRepository.find({
      where: { published: false },
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
        this.logger.warn(
          `Failed to relay reservation outbox ${row.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (processedCount > 0) {
      this.logger.log(`Relayed ${processedCount} reservation outbox events`);
    }

    return processedCount;
  }
}

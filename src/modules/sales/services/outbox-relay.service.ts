import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleOutboxEntity } from '../entities/sale-outbox.entity';
import { MessagingProducer } from '../../../core/messaging/producers/messaging.producer';
import type { PaymentConfirmedEvent } from '../../../core/messaging/events/payment-confirmed.event';
import {
  BATCH_SIZE,
  OUTBOX_EVENT_PAYMENT_CONFIRMED,
} from '../constants/outbox.constants';

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);

  constructor(
    @InjectRepository(SaleOutboxEntity)
    private readonly outboxRepository: Repository<SaleOutboxEntity>,
    private readonly messagingProducer: MessagingProducer,
  ) {}

  async processPendingEvents(): Promise<number> {
    const pending = await this.outboxRepository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
      take: BATCH_SIZE,
    });

    let processedCount = 0;

    for (const row of pending) {
      try {
        if (row.event === OUTBOX_EVENT_PAYMENT_CONFIRMED) {
          const payload = row.payload as unknown as PaymentConfirmedEvent;
          await this.messagingProducer.publishPaymentConfirmed(payload);
        } else {
          this.logger.warn(`Unknown outbox event type: ${row.event}`);
        }

        await this.outboxRepository.update({ id: row.id }, { processed: true });
        processedCount += 1;
      } catch (err) {
        this.logger.warn(
          `Failed to relay outbox event ${row.id} (${row.event}): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (processedCount > 0) {
      this.logger.log(`Relayed ${processedCount} outbox events`);
    }

    return processedCount;
  }
}

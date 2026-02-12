/**
 * @fileoverview Relay sale outbox use case.
 *
 * This use case is responsible for relaying pending sale outbox events to the messaging broker.
 * It fetches unprocessed events, publishes them to RabbitMQ, and marks them as processed.
 * It handles PaymentConfirmed events. Unknown event types are logged and skipped.
 *
 * @usecase relay-sale-outbox-use-case
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IUseCase } from 'src/common';
import { MessagingProducer } from 'src/core';
import type { PaymentConfirmedEvent } from 'src/core/messaging/events/payment-confirmed.event';
import { Repository } from 'typeorm';
import {
  BATCH_SIZE,
  OUTBOX_EVENT_PAYMENT_CONFIRMED,
} from '../constants/outbox.constants';
import { SaleOutboxEntity } from '../entities/sale-outbox.entity';

/**
 * Use case for relaying pending sale outbox events to the messaging broker.
 *
 * Fetches unprocessed events, publishes them to RabbitMQ, and marks them as processed.
 * Handles PaymentConfirmed events. Unknown event types are logged and skipped.
 */
@Injectable()
export class RelaySaleOutboxUseCase implements IUseCase<void, number> {
  /**
   * The logger used for logging events and warnings.
   * @type {Logger}
   * @private
   */
  private readonly logger: Logger = new Logger(RelaySaleOutboxUseCase.name);

  /**
   * Constructor for RelaySaleOutboxUseCase.
   *
   * @param {Repository<SaleOutboxEntity>} outboxRepository - Repository for accessing SaleOutboxEntity objects.
   * @param {MessagingProducer} messagingProducer - Messaging producer for publishing events.
   */
  constructor(
    @InjectRepository(SaleOutboxEntity)
    private readonly outboxRepository: Repository<SaleOutboxEntity>,
    private readonly messagingProducer: MessagingProducer,
  ) {}

  /**
   * Processes a batch of pending outbox events.
   *
   * Fetches up to {@link BATCH_SIZE} unprocessed outbox events from the database,
   * relays supported events (e.g., `PaymentConfirmedEvent`) to the messaging broker,
   * marks events as processed, and logs unknown event types or any processing failures.
   *
   * @async
   * @returns {Promise<number>} Number of events successfully relayed and marked as processed.
   */
  public async execute(): Promise<number> {
    /**
     * Fetches unprocessed outbox events, ordered by creation date and limited by BATCH_SIZE.
     * @type {Array<SaleOutboxEntity>}
     */
    const pending: Array<SaleOutboxEntity> = await this.outboxRepository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
      take: BATCH_SIZE,
    });

    /**
     * The number of events successfully processed and relayed.
     * @type {number}
     */
    let processedCount: number = 0;

    for (const row of pending) {
      try {
        /**
         * Handles only supported event types.
         * RELAYS: PaymentConfirmedEvent
         * Logs and skips unknown event types.
         */
        if (row.event === OUTBOX_EVENT_PAYMENT_CONFIRMED) {
          const payload: PaymentConfirmedEvent =
            row.payload as unknown as PaymentConfirmedEvent;
          await this.messagingProducer.publishPaymentConfirmed(payload);
        } else {
          this.logger.warn(`Unknown outbox event type: ${row.event}`);
        }

        await this.outboxRepository.update({ id: row.id }, { processed: true });
        processedCount += 1;
      } catch (err) {
        this.logger.warn(
          /**
           * Logs any exception that occurs during the relay of an outbox event.
           * Formats the error message appropriately whether it's an Error instance or another type.
           */
          `Failed to relay outbox event ${row.id} (${row.event}): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (processedCount > 0) {
      this.logger.log(`Relayed ${processedCount} sale outbox events`);
    }

    return processedCount;
  }
}

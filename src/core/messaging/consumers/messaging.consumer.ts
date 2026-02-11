import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Channel } from 'amqp-connection-manager';
import { Message } from 'amqplib';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { Events } from '../../../common';
import type {
  PaymentConfirmedEvent,
  ReservationCreatedEvent,
  ReservationExpiredEvent,
  SeatReleasedEvent,
} from '../events';

/**
 * Consumes events from RabbitMQ and processes them reliably.
 *
 * Responsibilities:
 * - Invalidates Redis cache for seat availability when seat state changes
 * - Provides structured audit logging for every domain event
 * - Acknowledges messages only after successful processing
 * - Nacks messages on failure (requeue=false) so they route to the DLQ
 */
@Injectable()
export class MessagingConsumer implements OnModuleInit {
  private readonly logger: Logger = new Logger(MessagingConsumer.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  public onModuleInit(): void {
    this.logger.log('Messaging consumer initialized', 'MessagingConsumer');
  }

  @EventPattern(Events.RESERVATION_CREATED)
  public async handleReservationCreated(
    @Payload() data: ReservationCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      await this.invalidateSessionSeatCache(data.sessionId);

      this.logger.log(
        JSON.stringify({
          event: Events.RESERVATION_CREATED,
          reservationId: data.reservationId,
          sessionId: data.sessionId,
          seatId: data.seatId,
          userId: data.userId,
          expiresAt: data.expiresAt,
        }),
      );

      this.ack(context);
    } catch (err) {
      this.logger.error(
        `Failed to process ${Events.RESERVATION_CREATED}: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.nack(context);
    }
  }

  @EventPattern(Events.PAYMENT_CONFIRMED)
  public async handlePaymentConfirmed(
    @Payload() data: PaymentConfirmedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      await this.invalidateSessionSeatCache(data.sessionId);

      this.logger.log(
        JSON.stringify({
          event: Events.PAYMENT_CONFIRMED,
          saleId: data.saleId,
          reservationId: data.reservationId,
          sessionId: data.sessionId,
          seatId: data.seatId,
          userId: data.userId,
          amount: data.amount,
        }),
      );

      this.ack(context);
    } catch (err) {
      this.logger.error(
        `Failed to process ${Events.PAYMENT_CONFIRMED}: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.nack(context);
    }
  }

  @EventPattern(Events.RESERVATION_EXPIRED)
  public async handleReservationExpired(
    @Payload() data: ReservationExpiredEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      await this.invalidateSessionSeatCache(data.sessionId);

      this.logger.log(
        JSON.stringify({
          event: Events.RESERVATION_EXPIRED,
          reservationId: data.reservationId,
          seatId: data.seatId,
          sessionId: data.sessionId,
        }),
      );

      this.ack(context);
    } catch (err) {
      this.logger.error(
        `Failed to process ${Events.RESERVATION_EXPIRED}: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.nack(context);
    }
  }

  @EventPattern(Events.SEAT_RELEASED)
  public async handleSeatReleased(
    @Payload() data: SeatReleasedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      await this.invalidateSessionSeatCache(data.sessionId);

      this.logger.log(
        JSON.stringify({
          event: Events.SEAT_RELEASED,
          seatId: data.seatId,
          sessionId: data.sessionId,
          reason: data.reason,
        }),
      );

      this.ack(context);
    } catch (err) {
      this.logger.error(
        `Failed to process ${Events.SEAT_RELEASED}: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.nack(context);
    }
  }

  private async invalidateSessionSeatCache(sessionId: string): Promise<void> {
    const cacheKey: string = `seats:session:${sessionId}`;
    await this.cache.del(cacheKey);
  }

  private ack(context: RmqContext): void {
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: Message = context.getMessage() as Message;
    channel.ack(originalMsg);
  }

  /**
   * Negatively acknowledges a message without requeue.
   * The message is routed to the Dead Letter Exchange (DLX) → Dead Letter Queue (DLQ).
   */
  private nack(context: RmqContext): void {
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: Message = context.getMessage() as Message;
    channel.nack(originalMsg, false, false);
  }
}

/**
 * @fileoverview RabbitMQ event consumer controller.
 *
 * @description
 * Subscribes to domain ReservationEvents (reservation created/expired, payment confirmed, seat released).
 * Invalidates seat availability cache and logs ReservationEvents. Nacks on failure to route to DLQ.
 * Implements idempotent consumption via deduplication: duplicate ReservationEvents (at-least-once)
 * are detected and skipped to avoid redundant processing and audit noise.
 *
 * @consumer messaging-consumer
 */

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel } from 'amqp-connection-manager';
import type { Message } from 'amqplib';
import { ReservationEvents, type Optional } from 'src/common';
import type {
  PaymentConfirmedEvent,
  ReservationCreatedEvent,
  ReservationExpiredEvent,
  SeatReleasedEvent,
} from '../events';

/**
 * TTL (time to live) in milliseconds for deduplication keys. Typically duplicate deliveries occur within minutes,
 * but we use 24 hours to be safe.
 * @type {number}
 */
const EVENT_DEDUP_TTL_MS: number = 86_400_000;

/**
 * Controller to consume and handle ReservationEvents from RabbitMQ.
 *
 * For each event:
 * - Checks deduplication
 * - Invalidates session seat cache
 * - Logs the event payload
 * - Acknowledges message on success
 * - Skips duplicate ReservationEvents (at-least-once semantics)
 * - Nacks message without requeue on error (for DLQ handling)
 */
@Controller()
export class MessagingConsumer implements OnModuleInit {
  /**
   * Logger instance for MessagingConsumer.
   * @type {Logger}
   * @private
   */
  private readonly logger: Logger = new Logger(MessagingConsumer.name);

  /**
   * Constructs the MessagingConsumer with a cache injected for deduplication and cache management.
   * @param {Cache} cache - The cache manager (e.g., Redis) for dedup and cache operations.
   */
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  /**
   * Lifecycle hook called when the module is initialized.
   * Logs when the messaging consumer is ready.
   * @returns {void}
   */
  public onModuleInit(): void {
    this.logger.log('Messaging consumer initialized', 'MessagingConsumer');
  }

  /**
   * Handles reservation.created event.
   *
   * @param {ReservationCreatedEvent} data - Event payload containing information about the new reservation
   * @param {RmqContext} context - RabbitMQ context (used for ack/nack)
   * @returns {Promise<void>}
   */
  @EventPattern(ReservationEvents.RESERVATION_CREATED)
  public async handleReservationCreated(
    @Payload() data: ReservationCreatedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      /**
       * Deduplication key for the reservation.created event.
       * @type {string}
       */
      const dedupKey: string = this.getDedupKey(
        ReservationEvents.RESERVATION_CREATED,
        data.reservationId,
      );
      if (await this.isDuplicate(dedupKey)) {
        this.logger.debug(`Duplicate event skipped: ${dedupKey}`);
        this.ack(context);
        return;
      }

      await this.invalidateSessionSeatCache(data.sessionId);

      this.logger.log(
        JSON.stringify({
          event: ReservationEvents.RESERVATION_CREATED,
          reservationId: data.reservationId,
          sessionId: data.sessionId,
          seatId: data.seatId,
          userId: data.userId,
          expiresAt: data.expiresAt,
        }),
      );

      await this.markProcessed(dedupKey);
      this.ack(context);
    } catch (err) {
      this.logger.error(
        `Failed to process ${ReservationEvents.RESERVATION_CREATED}: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.nack(context);
    }
  }

  /**
   * Handles payment.confirmed event.
   *
   * @param {PaymentConfirmedEvent} data - Event payload containing payment confirmation info
   * @param {RmqContext} context - RabbitMQ context (used for ack/nack)
   * @returns {Promise<void>}
   */
  @EventPattern(ReservationEvents.PAYMENT_CONFIRMED)
  public async handlePaymentConfirmed(
    @Payload() data: PaymentConfirmedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      /**
       * Deduplication key for the payment.confirmed event.
       * @type {string}
       */
      const dedupKey: string = this.getDedupKey(
        ReservationEvents.PAYMENT_CONFIRMED,
        data.saleId,
      );
      if (await this.isDuplicate(dedupKey)) {
        this.logger.debug(`Duplicate event skipped: ${dedupKey}`);
        this.ack(context);
        return;
      }

      await this.invalidateSessionSeatCache(data.sessionId);

      this.logger.log(
        JSON.stringify({
          event: ReservationEvents.PAYMENT_CONFIRMED,
          saleId: data.saleId,
          reservationId: data.reservationId,
          sessionId: data.sessionId,
          seatId: data.seatId,
          userId: data.userId,
          amount: data.amount,
        }),
      );

      await this.markProcessed(dedupKey);
      this.ack(context);
    } catch (err) {
      this.logger.error(
        `Failed to process ${ReservationEvents.PAYMENT_CONFIRMED}: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.nack(context);
    }
  }

  /**
   * Handles reservation.expired event.
   *
   * @param {ReservationExpiredEvent} data - Event payload indicating reservation expiration
   * @param {RmqContext} context - RabbitMQ context (used for ack/nack)
   * @returns {Promise<void>}
   */
  @EventPattern(ReservationEvents.RESERVATION_EXPIRED)
  public async handleReservationExpired(
    @Payload() data: ReservationExpiredEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      /**
       * Deduplication key for the reservation.expired event.
       * @type {string}
       */
      const dedupKey: string = this.getDedupKey(
        ReservationEvents.RESERVATION_EXPIRED,
        data.reservationId,
      );
      if (await this.isDuplicate(dedupKey)) {
        this.logger.debug(`Duplicate event skipped: ${dedupKey}`);
        this.ack(context);
        return;
      }

      await this.invalidateSessionSeatCache(data.sessionId);

      this.logger.log(
        JSON.stringify({
          event: ReservationEvents.RESERVATION_EXPIRED,
          reservationId: data.reservationId,
          seatId: data.seatId,
          sessionId: data.sessionId,
        }),
      );

      await this.markProcessed(dedupKey);
      this.ack(context);
    } catch (err) {
      this.logger.error(
        `Failed to process ${ReservationEvents.RESERVATION_EXPIRED}: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.nack(context);
    }
  }

  /**
   * Handles seat.released event.
   *
   * @param {SeatReleasedEvent} data - Event payload for seat released event
   * @param {RmqContext} context - RabbitMQ context (used for ack/nack)
   * @returns {Promise<void>}
   */
  @EventPattern(ReservationEvents.SEAT_RELEASED)
  public async handleSeatReleased(
    @Payload() data: SeatReleasedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      /**
       * Deduplication key for the seat.released event.
       * @type {string}
       */
      const dedupKey: string = this.getDedupKey(
        ReservationEvents.SEAT_RELEASED,
        data.reservationId,
      );
      if (await this.isDuplicate(dedupKey)) {
        this.logger.debug(`Duplicate event skipped: ${dedupKey}`);
        this.ack(context);
        return;
      }

      await this.invalidateSessionSeatCache(data.sessionId);

      this.logger.log(
        JSON.stringify({
          event: ReservationEvents.SEAT_RELEASED,
          reservationId: data.reservationId,
          seatId: data.seatId,
          sessionId: data.sessionId,
          reason: data.reason,
        }),
      );

      await this.markProcessed(dedupKey);
      this.ack(context);
    } catch (err) {
      this.logger.error(
        `Failed to process ${ReservationEvents.SEAT_RELEASED}: ${err instanceof Error ? err.message : String(err)}`,
      );
      this.nack(context);
    }
  }

  /**
   * Constructs a deduplication key for an event.
   *
   * @param {string} eventType - Event type (e.g. reservation.created)
   * @param {string} uniqueId - Domain-unique identifier (e.g. reservationId, saleId, etc.)
   * @returns {string} Cache key for deduplication tracking.
   * @private
   */
  private getDedupKey(eventType: string, uniqueId: string): string {
    return `event_dedup:${eventType}:${uniqueId}`;
  }

  /**
   * Checks if an event (by dedupKey) has already been processed (duplicate delivery).
   *
   * @param {string} dedupKey - Key from getDedupKey
   * @returns {Promise<boolean>} true if duplicate (already processed), false otherwise
   * @private
   */
  private async isDuplicate(dedupKey: string): Promise<boolean> {
    const seen: Optional<string> = await this.cache.get<string>(dedupKey);
    return seen != null;
  }

  /**
   * Marks an event as processed in the deduplication cache.
   *
   * @param {string} dedupKey - Key from getDedupKey
   * @returns {Promise<void>}
   * @private
   */
  private async markProcessed(dedupKey: string): Promise<void> {
    await this.cache.set(dedupKey, '1', EVENT_DEDUP_TTL_MS);
  }

  /**
   * Invalidates the cached seat availability for a session,
   * to ensure future lookups reflect latest seat state.
   *
   * @param {string} sessionId - Session UUID
   * @returns {Promise<void>}
   * @private
   */
  private async invalidateSessionSeatCache(sessionId: string): Promise<void> {
    const cacheKey: string = `seats:session:${sessionId}`;
    await this.cache.del(cacheKey);
  }

  /**
   * Acknowledges the RabbitMQ message to remove it from the queue.
   *
   * @param {RmqContext} context - RabbitMQ context
   * @returns {void}
   * @private
   */
  private ack(context: RmqContext): void {
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: Message = context.getMessage() as Message;
    channel.ack(originalMsg);
  }

  /**
   * Nacks the RabbitMQ message without requeuing, routing it to DLX/DLQ.
   *
   * @param {RmqContext} context - RabbitMQ context
   * @returns {void}
   * @private
   */
  private nack(context: RmqContext): void {
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: Message = context.getMessage() as Message;
    channel.nack(originalMsg, false, false);
  }
}

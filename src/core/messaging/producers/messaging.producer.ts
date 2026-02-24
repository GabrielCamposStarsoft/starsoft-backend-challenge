/**
 * @fileoverview RabbitMQ event producer with Publisher Confirms and automatic reconnection.
 *
 * Uses amqp-connection-manager to handle reconnection transparently. Messages published
 * while the broker is unavailable are buffered and delivered once the connection is restored.
 * Publisher Confirms ensure the broker has durably accepted the message before resolving.
 
 * @producer messaging-producer
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqpConnectionManager, {
  type AmqpConnectionManager,
  type ChannelWrapper,
} from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import { ReservationEvents } from '../../../common';
import type {
  PaymentConfirmedEvent,
  ReservationCreatedEvent,
  ReservationExpiredEvent,
  SeatReleasedEvent,
} from '../events';

/**
 * Maximum time to wait for a single broker confirm before rejecting.
 * @type {number}
 */
const PUBLISH_TIMEOUT_MS: number = 10_000;

/**
 * MessagingProducer is responsible for publishing domain events to RabbitMQ using Publisher Confirms,
 * with automatic reconnection via amqp-connection-manager. Exposes methods for various event types.
 * Implements OnModuleInit and OnModuleDestroy for lifecycle control in NestJS.
 *
 * @class
 * @implements {OnModuleInit}
 * @implements {OnModuleDestroy}
 */
@Injectable()
export class MessagingProducer implements OnModuleInit, OnModuleDestroy {
  /**
   * NestJS logger associated with this service.
   * @type {Logger}
   * @private
   * @readonly
   */
  private readonly logger: Logger = new Logger(MessagingProducer.name);

  /**
   * AMQP connection manager instance.
   * @type {AmqpConnectionManager}
   * @private
   */
  private connection: AmqpConnectionManager;

  /**
   * Channel wrapper for the confirm channel.
   * @type {ChannelWrapper}
   * @private
   */
  private channel: ChannelWrapper;

  /**
   * RabbitMQ exchange name for domain events.
   * @type {string}
   * @private
   * @readonly
   */
  private readonly exchange: string = 'cinema.exchange';

  /**
   * Constructs the MessagingProducer.
   * @param {ConfigService} config - Injected configuration service for accessing environment variables.
   */
  constructor(private readonly config: ConfigService) {}

  /**
   * Initializes the connection to RabbitMQ and sets up the confirm channel and exchange.
   * Waits until the channel is ready before module initialization proceeds.
   *
   * @public
   * @async
   * @returns {Promise<void>}
   */
  public async onModuleInit(): Promise<void> {
    /**
     * Connection URL fetched from environment via ConfigService,
     * or defaults to local instance if not set.
     * @type {string}
     */
    const url: string =
      this.config.get<string>('RMQ_URL') ?? 'amqp://guest:guest@localhost:5672';

    this.connection = amqpConnectionManager.connect([url]);

    this.connection.on('connect', () =>
      this.logger.log('RabbitMQ connected'),
    );
    this.connection.on('disconnect', ({ err }: { err: Error }) =>
      this.logger.warn(`RabbitMQ disconnected — reconnecting: ${err.message}`),
    );
    this.connection.on('connectFailed', ({ err }: { err: Error }) =>
      this.logger.error(`RabbitMQ connection attempt failed: ${err.message}`),
    );

    this.channel = this.connection.createChannel({
      confirm: true,
      /**
       * Sets up the topic exchange on channel creation.
       * @param {ConfirmChannel} ch
       */
      setup: async (ch: ConfirmChannel): Promise<void> => {
        await ch.assertExchange(this.exchange, 'topic', { durable: true });
        this.logger.log('RabbitMQ ConfirmChannel ready');
      },
    });

    await this.channel.waitForConnect();
  }

  /**
   * Publishes a JSON payload to the topic exchange and waits for broker confirmation.
   * Rejects if the broker does not confirm within PUBLISH_TIMEOUT_MS.
   *
   * @template T
   * @param {string} routingKey - AMQP routing key to publish under.
   * @param {T} payload - Payload object to serialize and send.
   * @returns {Promise<void>} Resolves once message is broker-acknowledged.
   * @private
   * @async
   */
  private async publish<T extends object>(routingKey: string, payload: T): Promise<void> {
    /**
     * Message body as serialized Buffer.
     * @type {Buffer}
     */
    const buffer: Buffer = Buffer.from(JSON.stringify(payload));

    /**
     * Promise that resolves when publish is broker-confirmed.
     * @type {Promise<boolean>}
     */
    const publishPromise: Promise<boolean> = this.channel.publish(
      this.exchange,
      routingKey,
      buffer,
      { persistent: true, contentType: 'application/json' },
    );

    /**
     * Timeout promise for fail-fast broker confirm wait.
     * @type {NodeJS.Timeout}
     */
    let timeoutId!: NodeJS.Timeout;
    const timeoutPromise: Promise<void> = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Publish timed out after ${PUBLISH_TIMEOUT_MS}ms`)),
        PUBLISH_TIMEOUT_MS,
      );
    });

    try {
      await Promise.race([publishPromise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Publishes a ReservationCreated event to RabbitMQ.
   *
   * @param {ReservationCreatedEvent} data - The event payload to publish.
   * @returns {Promise<void>} Resolves when the message is published and confirmed.
   * @public
   * @async
   */
  public async publishReservationCreated(
    data: ReservationCreatedEvent,
  ): Promise<void> {
    this.logger.log(
      `Publishing ${ReservationEvents.RESERVATION_CREATED}: ${data.reservationId}`,
    );
    await this.publish(ReservationEvents.RESERVATION_CREATED, data);
  }

  /**
   * Publishes a PaymentConfirmed event to RabbitMQ.
   *
   * @param {PaymentConfirmedEvent} data - The event payload to publish.
   * @returns {Promise<void>} Resolves when the message is published and confirmed.
   * @public
   * @async
   */
  public async publishPaymentConfirmed(
    data: PaymentConfirmedEvent,
  ): Promise<void> {
    this.logger.log(
      `Publishing ${ReservationEvents.PAYMENT_CONFIRMED}: ${data.saleId}`,
    );
    await this.publish(ReservationEvents.PAYMENT_CONFIRMED, data);
  }

  /**
   * Publishes a ReservationExpired event to RabbitMQ.
   *
   * @param {ReservationExpiredEvent} data - The event payload to publish.
   * @returns {Promise<void>} Resolves when the message is published and confirmed.
   * @public
   * @async
   */
  public async publishReservationExpired(
    data: ReservationExpiredEvent,
  ): Promise<void> {
    this.logger.log(
      `Publishing ${ReservationEvents.RESERVATION_EXPIRED}: ${data.reservationId}`,
    );
    await this.publish(ReservationEvents.RESERVATION_EXPIRED, data);
  }

  /**
   * Publishes a SeatReleased event to RabbitMQ.
   *
   * @param {SeatReleasedEvent} data - The event payload to publish.
   * @returns {Promise<void>} Resolves when the message is published and confirmed.
   * @public
   * @async
   */
  public async publishSeatReleased(data: SeatReleasedEvent): Promise<void> {
    this.logger.log(
      `Publishing ${ReservationEvents.SEAT_RELEASED}: ${data.seatId}`,
    );
    await this.publish(ReservationEvents.SEAT_RELEASED, data);
  }

  /**
   * Drains pending confirms and closes the managed connection on module shutdown.
   *
   * @public
   * @async
   * @returns {Promise<void>} Resolves when connections and channels are closed.
   */
  public async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
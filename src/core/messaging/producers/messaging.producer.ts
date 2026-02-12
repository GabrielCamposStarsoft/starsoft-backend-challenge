/**
 * @fileoverview RabbitMQ event producer.
 *
 * Publishes domain ReservationEvents to the cinema queue. Used by reservations and sales
 * modules to emit ReservationEvents for cache invalidation and audit.
 *
 * @producer messaging-producer
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ReservationEvents, RMQServices } from '../../../common';
import type {
  PaymentConfirmedEvent,
  ReservationCreatedEvent,
  ReservationExpiredEvent,
  SeatReleasedEvent,
} from '../events';

/**
 * Publishes domain ReservationEvents to RabbitMQ.
 *
 * @description Each publishX method emits the corresponding event with typed payload.
 * Uses fire-and-forget (emit); no response expected from consumers.
 */
@Injectable()
export class MessagingProducer {
  private readonly logger: Logger = new Logger(MessagingProducer.name);

  constructor(
    @Inject(RMQServices.CINEMA_RMQ_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  /**
   * Publishes reservation.created event.
   *
   * @param data - Event payload
   */
  public async publishReservationCreated(
    data: ReservationCreatedEvent,
  ): Promise<void> {
    this.logger.log(
      `Publishing ${ReservationEvents.RESERVATION_CREATED}: ${data.reservationId}`,
    );
    await lastValueFrom(
      this.client.emit(ReservationEvents.RESERVATION_CREATED, data),
    );
  }

  /**
   * Publishes payment.confirmed event.
   *
   * @param data - Event payload
   */
  public async publishPaymentConfirmed(
    data: PaymentConfirmedEvent,
  ): Promise<void> {
    this.logger.log(
      `Publishing ${ReservationEvents.PAYMENT_CONFIRMED}: ${data.saleId}`,
    );
    await lastValueFrom(
      this.client.emit(ReservationEvents.PAYMENT_CONFIRMED, data),
    );
  }

  /**
   * Publishes reservation.expired event.
   *
   * @param data - Event payload
   */
  public async publishReservationExpired(
    data: ReservationExpiredEvent,
  ): Promise<void> {
    this.logger.log(
      `Publishing ${ReservationEvents.RESERVATION_EXPIRED}: ${data.reservationId}`,
    );
    await lastValueFrom(
      this.client.emit(ReservationEvents.RESERVATION_EXPIRED, data),
    );
  }

  /**
   * Publishes seat.released event.
   *
   * @param data - Event payload
   */
  public async publishSeatReleased(data: SeatReleasedEvent): Promise<void> {
    this.logger.log(
      `Publishing ${ReservationEvents.SEAT_RELEASED}: ${data.seatId}`,
    );
    await lastValueFrom(
      this.client.emit(ReservationEvents.SEAT_RELEASED, data),
    );
  }
}

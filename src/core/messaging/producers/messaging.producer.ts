import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Events, RMQServices } from '../../../common';
import type {
  PaymentConfirmedEvent,
  ReservationCreatedEvent,
  ReservationExpiredEvent,
  SeatReleasedEvent,
} from '../events';

@Injectable()
export class MessagingProducer {
  private readonly logger: Logger = new Logger(MessagingProducer.name);

  constructor(
    @Inject(RMQServices.CINEMA_RMQ_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  public async publishReservationCreated(
    data: ReservationCreatedEvent,
  ): Promise<void> {
    this.logger.log(
      `Publishing ${Events.RESERVATION_CREATED}: ${data.reservationId}`,
    );
    await lastValueFrom(this.client.emit(Events.RESERVATION_CREATED, data));
  }

  public async publishPaymentConfirmed(
    data: PaymentConfirmedEvent,
  ): Promise<void> {
    this.logger.log(`Publishing ${Events.PAYMENT_CONFIRMED}: ${data.saleId}`);
    await lastValueFrom(this.client.emit(Events.PAYMENT_CONFIRMED, data));
  }

  public async publishReservationExpired(
    data: ReservationExpiredEvent,
  ): Promise<void> {
    this.logger.log(
      `Publishing ${Events.RESERVATION_EXPIRED}: ${data.reservationId}`,
    );
    await lastValueFrom(this.client.emit(Events.RESERVATION_EXPIRED, data));
  }

  public async publishSeatReleased(data: SeatReleasedEvent): Promise<void> {
    this.logger.log(`Publishing ${Events.SEAT_RELEASED}: ${data.seatId}`);
    await lastValueFrom(this.client.emit(Events.SEAT_RELEASED, data));
  }
}

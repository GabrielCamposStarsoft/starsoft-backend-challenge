import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Channel } from 'amqp-connection-manager';
import { Message } from 'amqplib';
import { Events } from '../../../common';
import type {
  PaymentConfirmedEvent,
  ReservationCreatedEvent,
  ReservationExpiredEvent,
  SeatReleasedEvent,
} from '../events';

@Injectable()
export class MessagingConsumer implements OnModuleInit {
  private readonly logger: Logger = new Logger(MessagingConsumer.name);

  public onModuleInit(): void {
    this.logger.log('Messaging consumer initialized', 'MessagingConsumer');
  }

  @EventPattern(Events.RESERVATION_CREATED)
  public handleReservationCreated(
    @Payload() data: ReservationCreatedEvent,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(
      `Reservation created: ${data.reservationId} for seat ${data.seatId}`,
    );
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: Message = context.getMessage() as Message;
    channel.ack(originalMsg);
  }

  @EventPattern(Events.PAYMENT_CONFIRMED)
  public handlePaymentConfirmed(
    @Payload() data: PaymentConfirmedEvent,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(
      `Payment confirmed: sale ${data.saleId} - reservation ${data.reservationId}`,
    );
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: Message = context.getMessage() as Message;
    channel.ack(originalMsg);
  }

  @EventPattern(Events.RESERVATION_EXPIRED)
  public handleReservationExpired(
    @Payload() data: ReservationExpiredEvent,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(
      `Reservation expired: ${data.reservationId}, releasing seat ${data.seatId}`,
    );
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: Message = context.getMessage() as Message;
    channel.ack(originalMsg);
  }

  @EventPattern(Events.SEAT_RELEASED)
  public handleSeatReleased(
    @Payload() data: SeatReleasedEvent,
    @Ctx() context: RmqContext,
  ): void {
    this.logger.log(`Seat released: ${data.seatId} (${data.reason})`);
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: Message = context.getMessage() as Message;
    channel.ack(originalMsg);
  }
}

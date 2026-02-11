import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { MessagingModule } from '../../core/messaging/messaging.module';
import { ReservationsController } from './controllers/reservations.controller';
import { ReservationsService } from './services/reservations.service';
import { ReservationsUseCases } from './use-cases';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ReservationEntity,
  ReservationOutboxEntity,
  ReservationExpirationOutboxEntity,
} from './entities';
import { SeatEntity } from '../seats/entities';
import { ReservationsExpirationScheduler } from './schedulers/reservation-expiration.scheduler';
import { ReservationOutboxRelayService } from './services/reservation-outbox-relay.service';
import { ReservationOutboxRelayScheduler } from './schedulers/reservation-outbox-relay.scheduler';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReservationEntity,
      SeatEntity,
      ReservationOutboxEntity,
      ReservationExpirationOutboxEntity,
    ]),
    RouterModule.register([
      { path: 'reservations', module: ReservationsModule },
    ]),
    MessagingModule,
  ],
  controllers: [ReservationsController],
  providers: [
    ReservationsService,
    ...ReservationsUseCases,
    ReservationsExpirationScheduler,
    ReservationOutboxRelayService,
    ReservationOutboxRelayScheduler,
  ],
  exports: [ReservationsService],
})
export class ReservationsModule {}

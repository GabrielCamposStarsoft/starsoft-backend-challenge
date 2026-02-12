/**
 * @fileoverview Reservations module.
 *
 * Manages seat reservations with outbox pattern for events. Includes schedulers
 * for expiration and outbox relay. Publishes reservation.created, reservation.expired, seat.released.
 *
 * @module reservations
 */

import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { MessagingModule } from '../../core/messaging/messaging.module';
import { ReservationsController } from './controllers';
import { ReservationsService } from './services';
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

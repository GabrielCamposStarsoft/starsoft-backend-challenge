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
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from 'src/core/';
import { SeatEntity } from '../seats/entities';
import { ReservationsController } from './controllers';
import {
  ReservationEntity,
  ReservationExpirationOutboxEntity,
  ReservationOutboxEntity,
} from './entities';
import {
  ReservationOutboxCleanupScheduler,
  ReservationOutboxRelayScheduler,
  ReservationsExpirationScheduler,
} from './schedulers';
import {
  ReservationOutboxCleanupService,
  ReservationsService,
} from './services';
import { ReservationsUseCases } from './use-cases';

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
    ReservationOutboxRelayScheduler,
    ReservationOutboxCleanupService,
    ReservationOutboxCleanupScheduler,
  ],
  exports: [ReservationsService],
})
export class ReservationsModule {}

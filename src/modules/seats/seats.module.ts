/**
 * @fileoverview Seats module.
 *
 * Manages seat creation for sessions. POST /seats requires admin role.
 *
 * @module seats
 */

import { Module } from '@nestjs/common';
import { SeatsController } from './controllers/seats.controller';
import { SeatsService } from './services/seats.service';
import { SeatsUseCases } from './use-cases';
import { SeatEntity } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '../sessions/entities';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([SeatEntity, SessionEntity]),
    RouterModule.register([{ path: 'seats', module: SeatsModule }]),
  ],
  controllers: [SeatsController],
  providers: [SeatsService, ...SeatsUseCases],
  exports: [SeatsService],
})
export class SeatsModule {}

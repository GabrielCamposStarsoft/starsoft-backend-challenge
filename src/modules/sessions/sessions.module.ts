/**
 * @fileoverview Sessions module.
 *
 * Manages movie sessions (CRUD) and seat availability. Exposes GET /sessions,
 * POST /sessions (admin), GET /sessions/:id, GET /sessions/:id/availability.
 *
 * @module sessions
 */

import { Module } from '@nestjs/common';
import { SessionsController } from './controllers';
import { SessionsService } from './services';
import { SessionsUseCases } from './use-cases';
import { SessionEntity } from './entities';
import { SeatEntity } from '../seats/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity, SeatEntity])],
  controllers: [SessionsController],
  providers: [SessionsService, ...SessionsUseCases],
  exports: [SessionsService],
})
export class SessionsModule {}

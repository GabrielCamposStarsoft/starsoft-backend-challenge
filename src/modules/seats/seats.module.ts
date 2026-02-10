import { Module } from '@nestjs/common';
import { SeatsController } from './controllers/seats.controller';
import { SeatsService } from './services/seats.service';
import { SeatsUseCases } from './use-cases';
import { SeatEntity } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '../sessions/entities';

@Module({
  imports: [TypeOrmModule.forFeature([SeatEntity, SessionEntity])],
  controllers: [SeatsController],
  providers: [SeatsService, ...SeatsUseCases],
  exports: [SeatsService],
})
export class SeatsModule {}

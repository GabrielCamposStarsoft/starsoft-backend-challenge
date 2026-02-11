import { Module } from '@nestjs/common';
import { SessionsController } from './controllers/sessions.controller';
import { SessionsService } from './services/sessions.service';
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

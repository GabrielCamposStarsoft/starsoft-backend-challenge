import { Module } from '@nestjs/common';
import { SalesController } from './controllers/sales.controller';
import { SalesService } from './services/sales.service';
import { RouterModule } from '@nestjs/core';
import { SalesUseCases } from './use-cases';
import { MessagingModule } from '../../core/messaging/messaging.module';
import { SaleOutboxEntity, SaleEntity } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxRelayService } from './services/outbox-relay.service';
import { OutboxRelayScheduler } from './schedulers';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleEntity, SaleOutboxEntity]),
    RouterModule.register([
      {
        path: 'sales',
        module: SalesModule,
      },
    ]),
    MessagingModule,
  ],
  controllers: [SalesController],
  providers: [
    SalesService,
    ...SalesUseCases,
    OutboxRelayService,
    OutboxRelayScheduler,
  ],
  exports: [SalesService],
})
export class SalesModule {}

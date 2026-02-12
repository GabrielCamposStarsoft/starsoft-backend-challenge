/**
 * @fileoverview Sales module.
 *
 * Manages ticket sales (payment confirmation). Uses outbox for payment.confirmed.
 * Schedulers relay outbox to RabbitMQ. Consumes PAYMENT_CONFIRMED for cache invalidation.
 *
 * @module sales
 */

import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from '../../core/messaging/messaging.module';
import { SalesController } from './controllers';
import { SaleEntity, SaleOutboxEntity } from './entities';
import { OutboxRelayScheduler } from './schedulers';
import { OutboxRelayService, SalesService } from './services';
import { SalesUseCases } from './use-cases';

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

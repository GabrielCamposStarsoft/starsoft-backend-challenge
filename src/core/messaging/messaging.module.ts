/**
 * @fileoverview RabbitMQ messaging module.
 *
 * Registers RabbitMQ client, consumer controller, producer, and DLQ setup.
 * Exports MessagingProducer for publishing domain events from feature modules.
 *
 * @module messaging
 */

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RMQServices } from '../../common';
import { RMQ_QUEUE, RMQ_DLX, RMQ_DLQ } from 'src/common';
import { MessagingProducer } from './producers';
import { MessagingConsumer } from './consumers';
import { DlqSetupService } from './services';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: RMQServices.CINEMA_RMQ_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
          queue: RMQ_QUEUE,
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': RMQ_DLX,
              'x-dead-letter-routing-key': RMQ_DLQ,
            },
          },
        },
      },
    ]),
  ],
  controllers: [MessagingConsumer],
  providers: [MessagingProducer, DlqSetupService],
  exports: [MessagingProducer],
})
/**
 * Nest module for RabbitMQ messaging.
 *
 * @description Configures durable queue with DLX/DLQ. MessagingConsumer
 * handles incoming events; MessagingProducer publishes to the queue.
 */
export class MessagingModule {}

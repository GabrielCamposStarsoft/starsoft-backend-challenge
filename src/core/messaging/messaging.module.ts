import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RMQServices } from '../../common';
import {
  RMQ_QUEUE,
  RMQ_DLX,
  RMQ_DLQ,
} from '../../common/constants/events.constants';
import { MessagingProducer } from './producers';
import { MessagingConsumer } from './consumers';
import { DlqSetupService } from './services/dlq-setup.service';

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
  providers: [MessagingProducer, MessagingConsumer, DlqSetupService],
  exports: [MessagingProducer],
})
export class MessagingModule {}

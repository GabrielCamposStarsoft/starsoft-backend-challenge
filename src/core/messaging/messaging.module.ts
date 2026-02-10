import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RMQServices } from '../../common';
import { RMQ_QUEUE } from '../../common/constants/events.constants';
import { MessagingProducer } from './producers';
import { MessagingConsumer } from './consumers';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: RMQServices.CINEMA_RMQ_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
          queue: RMQ_QUEUE,
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  providers: [MessagingProducer, MessagingConsumer],
  exports: [MessagingProducer],
})
export class MessagingModule {}

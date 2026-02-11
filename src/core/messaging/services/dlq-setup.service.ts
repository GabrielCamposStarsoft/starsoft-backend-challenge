import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { RMQ_DLQ, RMQ_DLX } from '../../../common/constants/events.constants';

/**
 * Asserts the Dead Letter Exchange (DLX) and Dead Letter Queue (DLQ) on startup.
 *
 * When a consumer nacks a message without requeue, RabbitMQ routes the message
 * to the DLX which delivers it to the DLQ for later inspection or retry.
 */
@Injectable()
export class DlqSetupService implements OnModuleInit {
  private readonly logger = new Logger(DlqSetupService.name);

  constructor(private readonly config: ConfigService) {}

  public async onModuleInit(): Promise<void> {
    const url: string =
      this.config.get<string>('RMQ_URL') ?? 'amqp://guest:guest@localhost:5672';

    try {
      const connection = await amqplib.connect(url);
      const channel = await connection.createChannel();

      await channel.assertExchange(RMQ_DLX, 'direct', { durable: true });
      await channel.assertQueue(RMQ_DLQ, { durable: true });
      await channel.bindQueue(RMQ_DLQ, RMQ_DLX, RMQ_DLQ);

      await channel.close();
      await connection.close();

      this.logger.log(
        `DLQ setup complete: exchange=${RMQ_DLX}, queue=${RMQ_DLQ}`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to setup DLQ: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

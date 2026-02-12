/**
 * @fileoverview Dead letter queue setup service.
 *
 * On module init, asserts DLX and DLQ in RabbitMQ so nacked messages
 * are routed to the DLQ for inspection/retry.
 *
 * @service dlq-setup
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type ChannelModel, connect as amqConnect } from 'amqplib';
import { RMQ_DLQ, RMQ_DLX } from '../../../common/constants';
import { Channel } from 'amqp-connection-manager';

/**
 * Asserts DLX and DLQ on application startup.
 *
 * @description Creates durable direct exchange (DLX) and queue (DLQ), bound
 * so nacked messages are routed for later inspection.
 */
@Injectable()
export class DlqSetupService implements OnModuleInit {
  private readonly logger: Logger = new Logger(DlqSetupService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Connects to RabbitMQ and asserts DLX, DLQ, and binding.
   *
   * @description Logs success or warning on failure. Does not throw.
   */
  public async onModuleInit(): Promise<void> {
    const url: string =
      this.config.get<string>('RMQ_URL') ?? 'amqp://guest:guest@localhost:5672';

    try {
      const connection: ChannelModel = await amqConnect(url);
      const channel: Channel = await connection.createChannel();

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

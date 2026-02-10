import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLock } from 'src/common';
import { OutboxRelayService } from '../services/outbox-relay.service';

@Injectable()
export class OutboxRelayScheduler {
  constructor(private readonly outboxRelayService: OutboxRelayService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  @DistributedLock('lock:outbox-relay', 25)
  async handleRelay(): Promise<void> {
    await this.outboxRelayService.processPendingEvents();
  }
}

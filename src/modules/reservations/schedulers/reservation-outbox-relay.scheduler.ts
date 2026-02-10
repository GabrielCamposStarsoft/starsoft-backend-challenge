import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLock } from 'src/common';
import { ReservationOutboxRelayService } from '../services/reservation-outbox-relay.service';

@Injectable()
export class ReservationOutboxRelayScheduler {
  constructor(
    private readonly reservationOutboxRelayService: ReservationOutboxRelayService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  @DistributedLock('lock:reservation-outbox-relay', 25)
  async handleRelay(): Promise<void> {
    await this.reservationOutboxRelayService.processPendingEvents();
    await this.reservationOutboxRelayService.processExpirationPendingEvents();
  }
}

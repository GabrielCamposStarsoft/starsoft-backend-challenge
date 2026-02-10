import { Injectable } from '@nestjs/common';
import { RelayReservationCreatedOutboxUseCase } from '../use-cases/relay-reservation-created-outbox.use-case';
import { RelayReservationExpirationOutboxUseCase } from '../use-cases/relay-reservation-expiration-outbox.use-case';

@Injectable()
export class ReservationOutboxRelayService {
  constructor(
    private readonly relayReservationCreatedOutboxUseCase: RelayReservationCreatedOutboxUseCase,
    private readonly relayReservationExpirationOutboxUseCase: RelayReservationExpirationOutboxUseCase,
  ) {}

  public async processPendingEvents(): Promise<number> {
    return this.relayReservationCreatedOutboxUseCase.execute();
  }

  public async processExpirationPendingEvents(): Promise<number> {
    return this.relayReservationExpirationOutboxUseCase.execute();
  }
}

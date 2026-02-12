/**
 * @fileoverview Reservation outbox relay service.
 *
 * This service is responsible for relaying outbox events related to reservations.
 * It delegates processing to the appropriate use cases.
 *
 * @service reservation-outbox-relay-service
 */

import { Injectable } from '@nestjs/common';
import {
  RelayReservationCreatedOutboxUseCase,
  RelayReservationExpirationOutboxUseCase,
} from '../use-cases';

/**
 * Service for relaying outbox events related to reservations.
 * Delegates processing to the appropriate use cases.
 */
@Injectable()
export class ReservationOutboxRelayService {
  /**
   * Constructs the ReservationOutboxRelayService.
   * @param relayReservationCreatedOutboxUseCase - Use case for relaying created reservation events.
   * @param relayReservationExpirationOutboxUseCase - Use case for relaying reservation expiration events.
   */
  constructor(
    private readonly relayReservationCreatedOutboxUseCase: RelayReservationCreatedOutboxUseCase,
    private readonly relayReservationExpirationOutboxUseCase: RelayReservationExpirationOutboxUseCase,
  ) {}

  /**
   * Processes pending reservation creation outbox events.
   * @returns {Promise<number>} Number of reservation creation events processed.
   */
  public async processPendingEvents(): Promise<number> {
    return await this.relayReservationCreatedOutboxUseCase.execute();
  }

  /**
   * Processes pending reservation expiration outbox events.
   * @returns {Promise<number>} Number of reservation expiration events processed.
   */
  public async processExpirationPendingEvents(): Promise<number> {
    return await this.relayReservationExpirationOutboxUseCase.execute();
  }
}

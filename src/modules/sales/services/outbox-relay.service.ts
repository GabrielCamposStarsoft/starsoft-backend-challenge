/**
 * @fileoverview Service for relaying outbox events related to sales.
 *
 * @service outbox-relay-service
 */
import { Injectable } from '@nestjs/common';
import { RelaySaleOutboxUseCase } from '../use-cases';

/**
 * @class OutboxRelayService
 * @classdesc Service responsible for relaying outbox events related to sales.
 * Utilizes RelaySaleOutboxUseCase to process events.
 */
@Injectable()
export class OutboxRelayService {
  /**
   * Creates an instance of OutboxRelayService.
   * @param {RelaySaleOutboxUseCase} relaySaleOutboxUseCase - The use case for relaying outbox events.
   */
  constructor(
    private readonly relaySaleOutboxUseCase: RelaySaleOutboxUseCase,
  ) {}

  /**
   * Processes all pending outbox events for sales and relays them to the broker.
   *
   * @method
   * @returns {Promise<number>} A promise that resolves to the number of events successfully processed.
   */
  public async processPendingEvents(): Promise<number> {
    return await this.relaySaleOutboxUseCase.execute();
  }
}

/**
 * @fileoverview Sales outbox cleanup service.
 *
 * Delegates cleanup logic to CleanSaleOutboxUseCase.
 *
 * @service sales-outbox-cleanup-service
 */
import { Injectable } from '@nestjs/common';
import { CleanSaleOutboxUseCase } from '../use-cases/clean-sale-outbox.use-case';

/**
 * Service responsible for cleaning up processed sales outbox records.
 * Thin orchestrator that delegates to CleanSaleOutboxUseCase.
 */
@Injectable()
export class SalesOutboxCleanupService {
  constructor(
    private readonly cleanSaleOutboxUseCase: CleanSaleOutboxUseCase,
  ) {}

  /**
   * Deletes processed outbox entries older than the retention threshold.
   *
   * @returns Total number of deleted entries.
   */
  public async cleanup(): Promise<number> {
    return this.cleanSaleOutboxUseCase.execute();
  }
}

/**
 * @fileoverview Use case for cleaning up processed sales outbox records.
 *
 * Deletes entries from sales_outbox where processed = true and createdAt
 * is older than the retention threshold.
 *
 * @usecase clean-sale-outbox-use-case
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, LessThan, Repository } from 'typeorm';
import type { IUseCase } from 'src/common';
import { SaleOutboxEntity } from '../entities';

/**
 * Number of days to retain processed outbox records.
 * Records older than this threshold will be deleted.
 * @const {number}
 */
const RETENTION_DAYS: number = 7;

@Injectable()
/**
 * Use case class responsible for cleaning up processed sales outbox entries
 * that are older than the configured retention period.
 *
 * Implements {@link IUseCase} with void input and returns the number of records deleted.
 */
export class CleanSaleOutboxUseCase implements IUseCase<void, number> {
  /**
   * Logger instance for the use case.
   * @type {Logger}
   * @private
   */
  private readonly logger: Logger = new Logger(CleanSaleOutboxUseCase.name);

  /**
   * Constructor for CleanSaleOutboxUseCase.
   * @param salesOutboxRepository Repository for managing SaleOutboxEntity persistence.
   */
  constructor(
    @InjectRepository(SaleOutboxEntity)
    private readonly salesOutboxRepository: Repository<SaleOutboxEntity>,
  ) {}

  /**
   * Deletes all processed outbox events from the sales_outbox table that are older than the retention threshold.
   * The deletion criteria:
   *   - processed === true
   *   - createdAt < (now - RETENTION_DAYS)
   *
   * Logs the count of deleted records if any records were removed.
   *
   * @async
   * @returns {Promise<number>} The number of deleted records.
   */
  public async execute(): Promise<number> {
    const retentionDate: Date = new Date();
    retentionDate.setDate(retentionDate.getDate() - RETENTION_DAYS);

    const result: DeleteResult = await this.salesOutboxRepository.delete({
      processed: true,
      createdAt: LessThan(retentionDate),
    });

    /**
     * The number of records deleted.
     * @type {number}
     */
    const deletedCount: number = result.affected ?? 0;
    if (deletedCount > 0) {
      this.logger.log(
        `Cleaned up ${deletedCount} processed sales outbox entries`,
      );
    }

    return deletedCount;
  }
}

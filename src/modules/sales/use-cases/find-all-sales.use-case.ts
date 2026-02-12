/**
 * @fileoverview Use case for finding all sales.
 *
 * @usecase find-all-sales-use-case
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity } from '../entities';
import type { IUseCase } from 'src/common';
import type { IFindAllSalesInput } from './interfaces';

/**
 * @class FindAllSalesUseCase
 * @classdesc Handles retrieval of all sales, with optional user ID filtering and pagination.
 */
@Injectable()
export class FindAllSalesUseCase implements IUseCase<
  IFindAllSalesInput,
  [Array<SaleEntity>, number]
> {
  /**
   * Logger instance for the use case.
   * @private
   * @type {Logger}
   */
  private readonly logger: Logger = new Logger(FindAllSalesUseCase.name);

  /**
   * Constructs the FindAllSalesUseCase.
   * @param {Repository<SaleEntity>} salesRepository - The repository instance for SaleEntity operations.
   */
  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
  ) {}

  /**
   * Retrieves a paginated list of sales, optionally filtered by userId.
   *
   * @async
   * @param {IFindAllSalesInput} options - The pagination and filter options.
   * @param {number} options.page - The current page number.
   * @param {number} options.limit - The number of items per page.
   * @param {string} [options.userId] - Optional filter for userId.
   * @returns {Promise<[SaleEntity[], number]>} A tuple: [sales array, total count].
   */
  public async execute(
    options: IFindAllSalesInput,
  ): Promise<[Array<SaleEntity>, number]> {
    const { page, limit, userId } = options;

    const where: Partial<SaleEntity> = userId != null ? { userId } : {};

    const [items, total]: [Array<SaleEntity>, number] =
      await this.salesRepository.findAndCount({
        where,
        take: limit,
        skip: (page - 1) * limit,
        order: { createdAt: 'DESC' },
      });

    this.logger.log(`Found ${total} sales (page ${page})`);

    return [items, total];
  }
}

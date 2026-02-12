/**
 * @fileoverview Use case for finding a sale by its ID.
 *
 * @usecase find-one-sales-use-case
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity } from '../entities';
import type { IUseCase } from 'src/common';
import type { IFindOneSalesInput } from './interfaces';

/**
 * Use case for finding a sale by its ID.
 *
 * @class FindOneSalesUseCase
 * @implements {IUseCase<IFindOneSalesInput, SaleEntity>}
 */
@Injectable()
export class FindOneSalesUseCase implements IUseCase<
  IFindOneSalesInput,
  SaleEntity
> {
  /**
   * Constructs the FindOneSalesUseCase.
   * @param {Repository<SaleEntity>} salesRepository - The repository for managing sale entities.
   * @param {I18nService} i18n - The internationalization service for error messages.
   */
  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Executes the use case to find a single sale by its ID and (optionally) user ID.
   * If the sale does not exist, throws a NotFoundException with an i18n-messaged error.
   *
   * @param {IFindOneSalesInput} input - Input object containing the sale ID and user ID.
   * @returns {Promise<SaleEntity>} The found sale entity.
   * @throws {NotFoundException} If no sale is found for the given ID and (if supplied) userId.
   */
  public async execute(input: IFindOneSalesInput): Promise<SaleEntity> {
    const { id, userId }: IFindOneSalesInput = input;
    const sale = await this.salesRepository.findOneBy({ id, userId });
    if (!sale) {
      throw new NotFoundException(
        this.i18n.t('common.sale.notFound', { args: { id } }),
      );
    }
    return sale;
  }
}

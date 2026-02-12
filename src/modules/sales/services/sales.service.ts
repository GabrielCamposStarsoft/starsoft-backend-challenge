/**
 * @fileoverview Sales domain service.
 *
 * Orchestrates create, findAll, findOne. Delegates to use cases.
 *
 * @service sales-service
 */

import { Injectable } from '@nestjs/common';
import { CreateSalesDto, SalesResponseDto } from '../dto';
import type { SaleEntity } from '../entities';
import {
  CreateSalesUseCase,
  FindAllSalesUseCase,
  FindOneSalesUseCase,
} from '../use-cases';
import type { IFindAllSalesResponse } from '../interfaces';
import type { Optional } from 'src/common';

/**
 * Service for managing sales-related operations.
 *
 * @class SalesService
 */
@Injectable()
export class SalesService {
  /**
   * Constructs the SalesService.
   * @param {CreateSalesUseCase} createSalesUseCase - The use case for creating sales.
   * @param {FindAllSalesUseCase} findAllSalesUseCase - The use case for finding all sales.
   * @param {FindOneSalesUseCase} findOneSalesUseCase - The use case for finding a sale by ID.
   */
  constructor(
    private readonly createSalesUseCase: CreateSalesUseCase,
    private readonly findAllSalesUseCase: FindAllSalesUseCase,
    private readonly findOneSalesUseCase: FindOneSalesUseCase,
  ) {}

  /**
   * Creates a new sale.
   * @param {CreateSalesDto} createDto - The data to create a new sale.
   * @param {string} userId - The ID of the user creating the sale.
   * @returns {Promise<SalesResponseDto>} The created sale as a response DTO.
   */
  public async create(
    createDto: CreateSalesDto,
    userId: string,
  ): Promise<SalesResponseDto> {
    const sale: SaleEntity = await this.createSalesUseCase.execute({
      ...createDto,
      userId,
    });
    return this.toResponseDto(sale);
  }

  /**
   * Retrieves all sales (paginated).
   * @param {Object} options - Options for pagination and filtering.
   * @param {number} options.page - The current page number.
   * @param {number} options.limit - Number of items per page.
   * @param {Optional<string>} [options.userId] - Optional user ID filter.
   * @returns {Promise<IFindAllSalesResponse>} The paginated sales data and meta information.
   */
  public async findAll(options: {
    page: number;
    limit: number;
    userId?: Optional<string>;
  }): Promise<IFindAllSalesResponse> {
    const [items, total]: [Array<SaleEntity>, number] =
      await this.findAllSalesUseCase.execute(options);

    return {
      data: items.map((item: SaleEntity) => this.toResponseDto(item)),
      meta: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  /**
   * Finds a single sale by ID.
   * @param {string} id - The ID of the sale to retrieve.
   * @returns {Promise<SalesResponseDto>} The sale as a response DTO.
   */
  public async findOne(id: string, userId: string): Promise<SalesResponseDto> {
    const sale: SaleEntity = await this.findOneSalesUseCase.execute({
      id,
      userId,
    });
    return this.toResponseDto(sale);
  }

  /**
   * Converts a SaleEntity to a SalesResponseDto.
   * @private
   * @param {SaleEntity} sale - The sale entity to map.
   * @returns {SalesResponseDto} The corresponding response DTO.
   */
  private toResponseDto(sale: SaleEntity): SalesResponseDto {
    return {
      id: sale.id,
      reservationId: sale.reservationId,
      sessionId: sale.sessionId,
      seatId: sale.seatId,
      userId: sale.userId,
      amount: sale.amount,
      createdAt: sale.createdAt,
    };
  }
}

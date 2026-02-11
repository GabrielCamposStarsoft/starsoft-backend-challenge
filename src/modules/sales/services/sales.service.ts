import { Injectable } from '@nestjs/common';
import type { IMeta } from 'src/common';
import { CreateSalesDto, SalesResponseDto, UpdateSalesDto } from '../dto';
import type { SaleEntity } from '../entities';
import {
  CreateSalesUseCase,
  DeleteSalesUseCase,
  FindAllSalesUseCase,
  FindOneSalesUseCase,
  UpdateSalesUseCase,
} from '../use-cases';

interface IFindAllSalesResponse {
  data: Array<SalesResponseDto>;
  meta: IMeta;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly createSalesUseCase: CreateSalesUseCase,
    private readonly findAllSalesUseCase: FindAllSalesUseCase,
    private readonly findOneSalesUseCase: FindOneSalesUseCase,
    private readonly updateSalesUseCase: UpdateSalesUseCase,
    private readonly deleteSalesUseCase: DeleteSalesUseCase,
  ) {}

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

  public async findAll(options: {
    page: number;
    limit: number;
    userId?: string;
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

  public async findOne(id: string): Promise<SalesResponseDto> {
    const sale: SaleEntity = await this.findOneSalesUseCase.execute({ id });
    return this.toResponseDto(sale);
  }

  public async update(
    id: string,
    updateDto: UpdateSalesDto,
  ): Promise<SalesResponseDto> {
    const sale = await this.updateSalesUseCase.execute(id, updateDto);
    return this.toResponseDto(sale);
  }

  public async remove(id: string): Promise<void> {
    await this.deleteSalesUseCase.execute({ id });
  }

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

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity } from '../entities';
import { IUseCase } from 'src/common';
import { IFindAllSalesInput } from './interfaces';

@Injectable()
export class FindAllSalesUseCase implements IUseCase<
  IFindAllSalesInput,
  [Array<SaleEntity>, number]
> {
  private readonly logger = new Logger(FindAllSalesUseCase.name);

  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
  ) {}

  public async execute(
    options: IFindAllSalesInput,
  ): Promise<[Array<SaleEntity>, number]> {
    const { page, limit, userId } = options;

    const where = userId ? { userId } : {};

    const [items, total] = await this.salesRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    this.logger.log(`Found ${total} sales (page ${page})`);

    return [items, total];
  }
}

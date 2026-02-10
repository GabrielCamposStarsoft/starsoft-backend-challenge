import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity } from '../entities';
import { IUseCase } from 'src/common';
import { IFindOneSalesInput } from './interfaces';

@Injectable()
export class FindOneSalesUseCase implements IUseCase<
  IFindOneSalesInput,
  SaleEntity
> {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
  ) {}

  public async execute(input: IFindOneSalesInput): Promise<SaleEntity> {
    const { id }: IFindOneSalesInput = input;
    const sale = await this.salesRepository.findOneBy({ id });
    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }
    return sale;
  }
}

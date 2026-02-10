import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity } from '../entities';
import { IUseCase } from 'src/common';
import { IDeleteSalesInput } from './interfaces';

@Injectable()
export class DeleteSalesUseCase implements IUseCase<IDeleteSalesInput, void> {
  private readonly logger: Logger = new Logger(DeleteSalesUseCase.name);

  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
  ) {}

  public async execute(input: IDeleteSalesInput): Promise<void> {
    const { id }: IDeleteSalesInput = input;
    const sale = await this.salesRepository.findOneBy({ id });
    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }

    await this.salesRepository.delete({ id });

    this.logger.log(`Sale ${id} deleted`);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
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
    private readonly i18n: I18nService,
  ) {}

  public async execute(input: IFindOneSalesInput): Promise<SaleEntity> {
    const { id }: IFindOneSalesInput = input;
    const sale = await this.salesRepository.findOneBy({ id });
    if (!sale) {
      throw new NotFoundException(
        this.i18n.t('common.sale.notFound', { args: { id } }),
      );
    }
    return sale;
  }
}

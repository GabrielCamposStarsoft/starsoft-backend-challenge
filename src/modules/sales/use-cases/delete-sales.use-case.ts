import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
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
    private readonly i18n: I18nService,
  ) {}

  public async execute(input: IDeleteSalesInput): Promise<void> {
    const { id }: IDeleteSalesInput = input;
    const sale = await this.salesRepository.findOneBy({ id });
    if (!sale) {
      throw new NotFoundException(
        this.i18n.t('common.sale.notFound', { args: { id } }),
      );
    }

    await this.salesRepository.delete({ id });

    this.logger.log(`Sale ${id} deleted`);
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSalesDto } from '../dto/update-sales.dto';
import { SaleEntity } from '../entities';

@Injectable()
export class UpdateSalesUseCase {
  private readonly logger: Logger = new Logger(UpdateSalesUseCase.name);

  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(
    id: string,
    updateDto: UpdateSalesDto,
  ): Promise<SaleEntity> {
    const sale = await this.salesRepository.findOneBy({ id });
    if (!sale) {
      throw new NotFoundException(
        this.i18n.t('common.sale.notFound', { args: { id } }),
      );
    }
    Object.assign(sale, updateDto);

    const saved: SaleEntity = await this.salesRepository.save(sale);

    this.logger.log(`Sale ${id} updated`);

    return saved;
  }
}

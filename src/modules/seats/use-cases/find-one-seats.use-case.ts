import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUseCase } from 'src/common';
import { SeatEntity } from '../entities';
import type { IFindByIdSeatsInput } from './interfaces';

@Injectable()
export class FindOneSeatsUseCase implements IUseCase<
  IFindByIdSeatsInput,
  SeatEntity
> {
  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatsRepository: Repository<SeatEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(input: IFindByIdSeatsInput): Promise<SeatEntity> {
    const { id }: IFindByIdSeatsInput = input;
    const seat = await this.seatsRepository.findOne({ where: { id } });
    if (!seat) {
      throw new NotFoundException(this.i18n.t('common.seat.notFound'));
    }
    return seat;
  }
}

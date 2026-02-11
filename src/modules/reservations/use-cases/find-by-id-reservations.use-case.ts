import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationEntity } from '../entities';
import type { IFindByIdReservationInput } from './interfaces';
import { IUseCase } from 'src/common';

@Injectable()
export class FindByIdReservationUseCase implements IUseCase<
  IFindByIdReservationInput,
  ReservationEntity
> {
  private readonly logger: Logger = new Logger(FindByIdReservationUseCase.name);
  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationsRepository: Repository<ReservationEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(
    input: IFindByIdReservationInput,
  ): Promise<ReservationEntity> {
    const { id }: IFindByIdReservationInput = input;
    const reservation = await this.reservationsRepository.findOne({
      where: { id },
    });
    if (!reservation) {
      this.logger.error(`Reservation not found with id: ${id}`);
      throw new NotFoundException(this.i18n.t('common.reservation.notFound'));
    }
    return reservation;
  }
}

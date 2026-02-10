import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
      throw new NotFoundException('Reservation not found');
    }
    return reservation;
  }
}

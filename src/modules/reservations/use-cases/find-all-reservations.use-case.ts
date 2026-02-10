import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationEntity } from '../entities';
import type { IFindAllReservationsInput } from './interfaces';
import { IUseCase } from 'src/common';

@Injectable()
export class FindAllReservationsUseCase implements IUseCase<
  IFindAllReservationsInput,
  [Array<ReservationEntity>, number]
> {
  private readonly logger: Logger = new Logger(FindAllReservationsUseCase.name);

  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationsRepository: Repository<ReservationEntity>,
  ) {}

  public async execute(
    input: IFindAllReservationsInput,
  ): Promise<[Array<ReservationEntity>, number]> {
    const where: Partial<ReservationEntity> = {};

    if (input.userId != null) {
      where.userId = input.userId;
    }
    if (input.sessionId != null) {
      where.sessionId = input.sessionId;
    }
    if (input.status != null) {
      where.status = input.status;
    }

    const [items, total]: [Array<ReservationEntity>, number] =
      await Promise.all([
        this.reservationsRepository.find({
          where,
          take: input.limit ?? 10,
          skip: ((input.page ?? 1) - 1) * (input.limit ?? 10),
          order: { createdAt: 'DESC' },
        }),
        this.reservationsRepository.count({ where }),
      ]);

    this.logger.log(
      `Found ${String(total)} reservations (page ${String(input.page ?? 1)})`,
    );

    return [items, total];
  }
}

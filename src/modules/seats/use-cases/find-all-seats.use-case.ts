import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SeatEntity } from '../entities';
import { IFindAllSeatsInput } from './interfaces';

@Injectable()
export class FindAllSeatsUseCase {
  private readonly logger = new Logger(FindAllSeatsUseCase.name);

  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatsRepository: Repository<SeatEntity>,
  ) {}

  public async execute(
    input: IFindAllSeatsInput,
  ): Promise<[SeatEntity[], number]> {
    const { page, limit, sessionId } = input;

    const where = sessionId ? { sessionId } : {};

    const [items, total] = await this.seatsRepository.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: { label: 'ASC' },
    });

    this.logger.log(`Found ${total} seats (page ${page})`);

    return [items, total];
  }
}

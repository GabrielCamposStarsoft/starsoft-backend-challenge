import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUseCase } from 'src/common';
import { SeatEntity } from '../entities';
import { SeatStatus } from '../enums';
import type { IUpdateSeatsInput } from './interfaces';

@Injectable()
export class UpdateSeatsUseCase implements IUseCase<
  IUpdateSeatsInput,
  SeatEntity
> {
  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatsRepository: Repository<SeatEntity>,
  ) {}

  public async execute(input: IUpdateSeatsInput): Promise<SeatEntity> {
    const { id, status }: IUpdateSeatsInput = input;
    const seat = await this.seatsRepository.findOne({ where: { id } });
    if (!seat) {
      throw new NotFoundException('Seat not found');
    }
    if (seat.status === SeatStatus.SOLD) {
      throw new ConflictException('Seat is sold');
    }
    seat.status = status;
    return await this.seatsRepository.save(seat);
  }
}

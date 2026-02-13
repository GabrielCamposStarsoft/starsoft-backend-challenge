/**
 * @fileoverview Use case for updating a seat's status (admin only).
 *
 * @usecase update-seats-use-case
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IUseCase, Nullable } from 'src/common';
import { Repository } from 'typeorm';
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
    private readonly seatRepository: Repository<SeatEntity>,
  ) {}

  /**
   * Updates a seat's status. Only AVAILABLE, BLOCKED, MAINTENANCE allowed.
   * RESERVED and SOLD must be set via reservation/payment flow.
   */
  public async execute(input: IUpdateSeatsInput): Promise<SeatEntity> {
    const { id, status } = input;

    const seat: Nullable<SeatEntity> = await this.seatRepository.findOne({
      where: { id },
    });

    if (!seat) {
      throw new NotFoundException(`Seat with id ${id} not found`);
    }

    seat.status = status as SeatStatus;
    return this.seatRepository.save(seat);
  }
}

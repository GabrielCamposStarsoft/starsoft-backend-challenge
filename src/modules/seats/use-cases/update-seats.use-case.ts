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
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UpdateSeatsUseCase implements IUseCase<
  IUpdateSeatsInput,
  SeatEntity
> {
  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatRepository: Repository<SeatEntity>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Updates a seat's status. Only AVAILABLE, BLOCKED, MAINTENANCE allowed.
   * RESERVED and SOLD must be set via reservation/payment flow.
   */
  public async execute(input: IUpdateSeatsInput): Promise<SeatEntity> {
    /**
     * Extract the seat ID and status from the input.
     * @type {IUpdateSeatsInput}
     */
    const { id, status }: IUpdateSeatsInput = input;
    /**
     * Attempt to find the seat by ID.
     * @type {Nullable<SeatEntity>}
     */
    const seat: Nullable<SeatEntity> = await this.seatRepository.findOne({
      where: { id },
    });

    // Throw 404 if seat does not exist.
    if (!seat) {
      throw new NotFoundException(
        this.i18n.t('common.seat.notFoundWithId', { args: { id } }),
      );
    }

    /**
     * Update the seat status.
     * @type {SeatStatus}
     */
    seat.status = status as SeatStatus;

    /**
     * Save the updated seat.
     * @returns {Promise<SeatEntity>}
     *
     * @throws {ConflictException} If the seat status is not allowed.
     */
    return this.seatRepository.save(seat);
  }
}

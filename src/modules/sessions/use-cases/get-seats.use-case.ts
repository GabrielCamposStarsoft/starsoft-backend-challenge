/**
 * @fileoverview Use case for retrieving all seats of a specific session, along with their current status.
 * Ensures the session exists before attempting to retrieve seats. If the session has no seats,
 * returns an empty array.
 *
 * @use-case get-seats-use-case
 */
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { IUseCase } from 'src/common';
import { SeatEntity } from 'src/modules/seats/entities';
import { Repository } from 'typeorm';
import type { IGetSeatsInput } from './interfaces';
import { FindSessionByIdUseCase } from './find-one-sessions.use-case';

/**
 * Use case for retrieving all seats of a specific session, along with their current status.
 * Ensures the session exists before attempting to retrieve seats. If the session has no seats,
 * returns an empty array.
 */
@Injectable()
export class GetSeatsUseCase implements IUseCase<
  IGetSeatsInput,
  Array<SeatEntity>
> {
  /**
   * @param seatRepository - TypeORM repository for SeatEntity.
   * @param findSessionByIdUseCase - Use case to verify the existence of the session.
   */
  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatRepository: Repository<SeatEntity>,
    private readonly findSessionByIdUseCase: FindSessionByIdUseCase,
  ) {}

  /**
   * Retrieves all seats for the given session ID, ordered by label in ascending order.
   * If the session does not exist, an error will be thrown from the findSessionByIdUseCase.
   * If the session has no associated seats, an empty array is returned.
   *
   * @param input - Object containing the session ID for which to list seats.
   * @returns Promise resolving to an array of SeatEntity objects.
   */
  public async execute(input: IGetSeatsInput): Promise<Array<SeatEntity>> {
    await this.findSessionByIdUseCase.execute({ id: input.sessionId });

    const seats: Array<SeatEntity> = await this.seatRepository.find({
      where: { sessionId: input.sessionId },
      order: { label: 'ASC' },
    });

    return seats;
  }
}

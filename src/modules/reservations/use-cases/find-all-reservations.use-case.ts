/**
 * @fileoverview Use case for finding and paginating reservations.
 *
 * @usecase find-all-reservations-use-case
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IUseCase } from 'src/common';
import { Repository } from 'typeorm';
import { ReservationEntity } from '../entities';
import type { IFindAllReservationsInput } from './interfaces';

/**
 * @class FindAllReservationsUseCase
 * @implements {IUseCase<IFindAllReservationsInput, [Array<ReservationEntity>, number]>}
 * @classdesc Use case for finding and paginating reservations. Supports filtering by user, session, and status.
 */
@Injectable()
export class FindAllReservationsUseCase implements IUseCase<
  IFindAllReservationsInput,
  [Array<ReservationEntity>, number]
> {
  /** Logger instance for this use case. */
  private readonly logger: Logger = new Logger(FindAllReservationsUseCase.name);

  /**
   * Constructs FindAllReservationsUseCase.
   * @param reservationsRepository - Repository for ReservationEntity objects.
   */
  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationsRepository: Repository<ReservationEntity>,
  ) {}

  /**
   * Find and paginate reservations optionally filtered by user, session, and status.
   *
   * @param {IFindAllReservationsInput} input - Query parameters: userId, sessionId, status, limit, and page.
   * @returns {Promise<[Array<ReservationEntity>, number]>}
   *   Resolves to a tuple containing the array of found reservations and total count.
   *
   * @example
   *   // Find reservations for a user, page 1, limit 10
   *   const [reservations, total] = await findAllReservationsUseCase.execute({
   *     userId: '123', page: 1, limit: 10
   *   });
   */
  public async execute(
    input: IFindAllReservationsInput,
  ): Promise<[Array<ReservationEntity>, number]> {
    /**
     * Build the dynamic filter object according to input parameters.
     * @type {Partial<ReservationEntity>}
     */
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

    /**
     * Execute find and count operations in parallel for efficiency.
     * - Finds reservations with pagination and ordering.
     * - Counts total matching reservations.
     */
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

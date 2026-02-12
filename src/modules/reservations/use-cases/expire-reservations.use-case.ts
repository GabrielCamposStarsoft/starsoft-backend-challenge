/**
 * @fileoverview Use case for expiring pending reservations that have passed their expiration time.
 *
 * @usecase expire-reservations-use-case
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IUseCase, Nullable } from 'src/common';
import {
  DataSource,
  LessThanOrEqual,
  Repository,
  UpdateResult,
  type QueryRunner,
} from 'typeorm';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import { BATCH_SIZE } from '../constants';
import {
  ReservationEntity,
  ReservationExpirationOutboxEntity,
} from '../entities';
import { ReservationStatus } from '../enums';

/**
 * @class ExpireReservationsUseCase
 * @implements {IUseCase<Date, void>}
 * @classdesc Use case for expiring pending reservations that have passed their expiration time.
 *
 * Finds all pending reservations whose `expiresAt` timestamp is less than or equal to the supplied time,
 * marks them as expired, optionally releases associated seats, and inserts an outbox event for expiration.
 */
@Injectable()
export class ExpireReservationsUseCase implements IUseCase<Date, void> {
  /** Logger instance for this use case. */
  private readonly logger: Logger = new Logger(ExpireReservationsUseCase.name);

  /**
   * Create an instance of ExpireReservationsUseCase.
   * @param {DataSource} dataSource - The TypeORM data source for transactional operations.
   * @param {Repository<ReservationEntity>} reservationsRepository - Repository to access reservations.
   */
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ReservationEntity)
    private readonly reservationsRepository: Repository<ReservationEntity>,
  ) {}

  /**
   * Expires pending reservations that have passed their expiration time.
   *
   * For each pending reservation whose `expiresAt` is earlier than or equal to `now`:
   * - Locks the reservation.
   * - Marks the reservation as expired.
   * - Sets the corresponding seat to available (if applicable).
   * - Inserts a ReservationExpirationOutboxEntity event indicating expiration.
   * - Operates in a transaction, rolling back if any error occurs.
   *
   * @async
   * @param {Date} [now=new Date()] - The current time, used to determine reservation expiration.
   * @returns {Promise<void>} Resolves when all applicable expired reservations are processed.
   */
  public async execute(now: Date = new Date()): Promise<void> {
    /**
     * Find all pending reservations that have expired as of `now`, up to {@link BATCH_SIZE}.
     * @type {Array<ReservationEntity>}
     */
    const expiredReservations: Array<ReservationEntity> =
      await this.reservationsRepository.find({
        where: {
          status: ReservationStatus.PENDING,
          expiresAt: LessThanOrEqual(now),
        },
        take: BATCH_SIZE,
        order: { expiresAt: 'ASC' },
      });

    let expiredCount: number = 0;

    for (const reservation of expiredReservations) {
      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        /**
         * Lock the reservation row for update to prevent concurrent expiry or modifications.
         * @type {Nullable<ReservationEntity>}
         */
        const locked: Nullable<ReservationEntity> =
          await queryRunner.manager.findOne(ReservationEntity, {
            where: {
              id: reservation.id,
              status: ReservationStatus.PENDING,
            },
            lock: { mode: 'pessimistic_write' },
          });

        if (!locked) {
          // Reservation was modified concurrently (already expired, confirmed, etc).
          await queryRunner.rollbackTransaction();
          continue;
        }

        /**
         * Mark the reservation as expired.
         */
        await queryRunner.manager.update(
          ReservationEntity,
          { id: reservation.id, status: ReservationStatus.PENDING },
          { status: ReservationStatus.EXPIRED },
        );

        /**
         * Attempt to set the seat back to available if it is still reserved.
         * Also increments its version.
         * @type {UpdateResult}
         */
        const seatUpdateResult: UpdateResult = await queryRunner.manager
          .createQueryBuilder()
          .update(SeatEntity)
          .set({
            status: SeatStatus.AVAILABLE,
            version: () => 'version + 1',
          })
          .where('id = :seatId', { seatId: reservation.seatId })
          .andWhere('session_id = :sessionId', {
            sessionId: reservation.sessionId,
          })
          .andWhere('status = :status', { status: SeatStatus.RESERVED })
          .execute();

        /**
         * Whether the seat was actually released (was previously reserved).
         * @type {boolean}
         */
        const seatReleased: boolean = (seatUpdateResult.affected ?? 0) > 0;

        /**
         * Insert an outbox event for reservation expiration, to be later relayed.
         */
        await queryRunner.manager.insert(ReservationExpirationOutboxEntity, {
          reservationId: reservation.id,
          seatId: reservation.seatId,
          sessionId: reservation.sessionId,
          seatReleased,
          reason: 'expired',
          published: false,
        });

        await queryRunner.commitTransaction();
        expiredCount += 1;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.warn(
          `Failed to expire reservation ${reservation.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        await queryRunner.release();
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} reservations`);
    }
  }
}

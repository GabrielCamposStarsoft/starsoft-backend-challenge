/**
 * @fileoverview Use case for deleting a reservation.
 *
 * @usecase delete-reservations-use-case
 */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DataSource, type UpdateResult } from 'typeorm';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import {
  ReservationEntity,
  ReservationExpirationOutboxEntity,
} from '../entities';
import { ReservationStatus } from '../enums';
import type { IDeleteReservationsInput } from './interfaces';
import { IUseCase } from 'src/common';

/**
 * @class DeleteReservationsUseCase
 * @implements {IUseCase<IDeleteReservationsInput, void>}
 * @classdesc Use case for deleting a reservation.
 *
 * - Ensures reservation exists and belongs to the user.
 * - Forbids deleting non-pending reservations (confirmed, expired, or cancelled).
 * - If reservation is pending, releases the seat and inserts a reservation expiration outbox event.
 * - Deletes the reservation from the database.
 *
 * @throws {NotFoundException} If reservation is not found.
 * @throws {ForbiddenException} If user is not the reservation owner.
 * @throws {ConflictException} If attempting to delete a non-pending reservation.
 */
@Injectable()
export class DeleteReservationsUseCase implements IUseCase<
  IDeleteReservationsInput,
  void
> {
  /**
   * Logger instance.
   * @type {Logger}
   * @private
   * @readonly
   */
  private readonly logger: Logger = new Logger(DeleteReservationsUseCase.name);

  /**
   * Constructs DeleteReservationsUseCase.
   * @param {DataSource} dataSource - The TypeORM data source for transactional operations.
   * @param {I18nService} i18n - i18n service for localized error messages.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Deletes a reservation by ID, enforcing user ownership and business rules.
   * If reservation is pending, releases the seat and inserts an expiration outbox event.
   *
   * @param {IDeleteReservationsInput} input - The reservation deletion input.
   * @returns {Promise<void>} Resolves when the reservation is deleted.
   * @throws {NotFoundException} If reservation not found.
   * @throws {ForbiddenException} If reservation does not belong to user.
   * @throws {ConflictException} If reservation is not pending.
   */
  public async execute(input: IDeleteReservationsInput): Promise<void> {
    const { id, userId }: IDeleteReservationsInput = input;

    await this.dataSource.transaction(async (manager) => {
      // Fetch reservation with pessimistic write lock.
      const reservation = await manager.findOne(ReservationEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      // Throw if not found.
      if (!reservation) {
        this.logger.error(`Reservation not found with id: ${id}`);
        throw new NotFoundException(this.i18n.t('common.reservation.notFound'));
      }

      // Ensure the reservation belongs to the caller.
      if (reservation.userId !== userId) {
        throw new ForbiddenException(this.i18n.t('common.reservation.ownOnly'));
      }

      // Only pending reservations can be deleted. Block CONFIRMED, EXPIRED, and CANCELLED.
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new ConflictException(
          this.i18n.t('common.reservation.cannotDeleteNonPending'),
        );
      }

      // If pending, release the seat and enqueue expiration event.
      if (reservation.status === ReservationStatus.PENDING) {
        /**
         * Attempt to release the reserved seat, reverting to available if reserved.
         * @type {UpdateResult}
         */
        const seatUpdateResult: UpdateResult = await manager
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
         * Indicates if the seat was actually released.
         * @type {boolean}
         */
        const seatReleased: boolean = (seatUpdateResult.affected ?? 0) > 0;

        // Insert expiration outbox entry for the deleted reservation.
        await manager.insert(ReservationExpirationOutboxEntity, {
          reservationId: reservation.id,
          seatId: reservation.seatId,
          sessionId: reservation.sessionId,
          seatReleased,
          reason: 'cancelled',
          published: false,
        });
      }

      // Delete the reservation entity.
      await manager.delete(ReservationEntity, { id });
    });

    this.logger.log(`Reservation ${id} deleted and seat released`);
  }
}

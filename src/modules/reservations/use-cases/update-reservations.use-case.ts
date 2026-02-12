/**
 * @fileoverview Use case for updating a reservation, handling status transitions, user ownership checks, seat release, and outbox notifications.
 *
 * @usecase update-reservations-use-case
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DataSource, UpdateResult } from 'typeorm';
import {
  ReservationEntity,
  ReservationExpirationOutboxEntity,
} from '../entities';
import { SeatEntity } from '../../seats/entities';
import { ReservationStatus } from '../enums';
import { SeatStatus } from '../../seats/enums';
import { UpdateReservationsDto } from '../dto';
import type { Nullable } from 'src/common';

/**
 * Defines the valid state transitions for reservations.
 *
 * CONFIRMED and EXPIRED are intentionally excluded from API-driven transitions:
 * - CONFIRMED: only via CreateSalesUseCase (payment confirmation).
 * - EXPIRED: only via ExpireReservationsUseCase (scheduler).
 */
const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [ReservationStatus.CANCELLED],
  [ReservationStatus.CONFIRMED]: [],
  [ReservationStatus.EXPIRED]: [],
  [ReservationStatus.CANCELLED]: [],
};

/**
 * Use case to update a reservation, handling status transitions,
 * user ownership checks, seat release, and outbox notifications.
 */
@Injectable()
export class UpdateReservationsUseCase {
  /**
   * Logger instance namespaced under this use case.
   * @private
   */
  private readonly logger: Logger = new Logger(UpdateReservationsUseCase.name);

  /**
   * Constructs the use case with transaction-aware DataSource and i18n provider.
   * @param dataSource TypeORM DataSource for DB transactions.
   * @param i18n I18nService for localized error messages.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Updates a reservation, verifying existence, ownership, and valid status transitions.
   * Handles seat release and ReservationExpirationOutbox creation on EXPIRED or CANCELLED.
   *
   * @param id The reservation identifier.
   * @param updateDto The reservation fields to update, possibly including a status change.
   * @param userId The ID of the user making the request, used for ownership validation.
   * @returns The updated ReservationEntity.
   * @throws NotFoundException if the reservation does not exist.
   * @throws ForbiddenException if the user does not own the reservation.
   * @throws ConflictException if the status transition is invalid or concurrent update occurs.
   */
  public async execute(
    id: string,
    updateDto: UpdateReservationsDto,
    userId: string,
  ): Promise<ReservationEntity> {
    return this.dataSource.transaction(async (manager) => {
      // Attempt to acquire the reservation entity with a write lock.
      const reservation = await manager.findOne(ReservationEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      // Throw if reservation does not exist.
      if (!reservation) {
        throw new NotFoundException(
          this.i18n.t('common.reservation.notFoundWithId', { args: { id } }),
        );
      }

      // Throw if the user does not own the reservation.
      if (reservation.userId !== userId) {
        throw new ForbiddenException(this.i18n.t('common.reservation.ownOnly'));
      }

      // If status is being updated, validate the transition and handle seat release if needed.
      if (updateDto.status !== undefined) {
        const allowed: Array<ReservationStatus> =
          VALID_TRANSITIONS[reservation.status];

        const nextStatus: Nullable<ReservationStatus> = updateDto.status;

        if (nextStatus == null) {
          // If intention is to change status but value is null, signal conflict.
          throw new ConflictException('Status is required for this transition');
        }

        // Throw if transition is not valid according to allowed transitions.
        if (!allowed.includes(nextStatus)) {
          throw new ConflictException(
            this.i18n.t('common.reservation.invalidTransition', {
              args: {
                from: reservation.status,
                to: String(nextStatus),
              },
            }),
          );
        }

        // If status is set to CANCELLED or EXPIRED, release the seat and record in outbox.
        if (
          nextStatus === ReservationStatus.CANCELLED ||
          nextStatus === ReservationStatus.EXPIRED
        ) {
          // Attempt to update seat status to AVAILABLE if it is currently RESERVED.
          const result: UpdateResult = await manager
            .createQueryBuilder()
            .update(SeatEntity)
            .set({ status: SeatStatus.AVAILABLE })
            .where('id = :id AND status = :status', {
              id: reservation.seatId,
              status: SeatStatus.RESERVED,
            })
            .execute();

          // Track if a seat was actually released.
          const isSeatReleased: boolean = result.affected === 1;

          // Publish a record to the ReservationExpirationOutboxEntity for downstream processes.
          await manager.insert(ReservationExpirationOutboxEntity, {
            reservationId: reservation.id,
            seatId: reservation.seatId,
            sessionId: reservation.sessionId,
            seatReleased: isSeatReleased,
            reason:
              nextStatus === ReservationStatus.CANCELLED
                ? 'cancelled'
                : 'expired',
            published: false,
          });
        }
      }

      // Attempt to update the reservation entity strictly if status matches (for concurrency control).
      const updateReservationResult = await manager
        .createQueryBuilder()
        .update(ReservationEntity)
        .set(updateDto)
        .where('id = :id AND status = :currentStatus', {
          id: reservation.id,
          currentStatus: reservation.status,
        })
        .execute();

      // If update did not affect any rows, signal possible concurrent modification.
      if (updateReservationResult.affected === 0) {
        throw new ConflictException('Reservation state changed concurrently');
      }

      // Re-acquire the updated reservation for return value (locked).
      const updated: ReservationEntity = await manager.findOneOrFail(
        ReservationEntity,
        {
          where: { id: reservation.id },
          lock: { mode: 'pessimistic_write' },
        },
      );

      // Log the successful update.
      this.logger.log(`Reservation ${id} updated`);

      // Return the updated reservation.
      return updated;
    });
  }
}

/**
 * @fileoverview Use case for handling the sale creation process.
 *
 * Ensures all actions are atomic and consistent by performing them inside a single database transaction.
 * Performs locking and validation on reservations and seats, creates the sale, and writes an outbox event for distributed processing.
 *
 * @usecase create-sales-use-case
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DataSource, QueryRunner } from 'typeorm';

import type { IUseCase, Nullable } from 'src/common';
import { ReservationEntity } from '../../reservations/entities';
import { ReservationStatus } from '../../reservations/enums';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import { SessionEntity } from '../../sessions/entities';
import { SaleEntity, SaleOutboxEntity } from '../entities';
import type { ICreateSalesInput } from './interfaces';

@Injectable()
export class CreateSalesUseCase implements IUseCase<
  ICreateSalesInput,
  SaleEntity
> {
  /**
   * Logger instance for the use case.
   * @private
   * @type {Logger}
   */
  private readonly logger: Logger = new Logger(CreateSalesUseCase.name);

  /**
   * @constructor
   * @param {DataSource} dataSource - TypeORM data source for transaction management.
   * @param {I18nService} i18n - Service for translation of error messages.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Executes the sale creation process in a single atomic transaction.
   *
   * The method includes:
   * - Locking and validating the reservation using a pessimistic write lock.
   * - Validating reservation state (ownership, status, expiration).
   * - Locking and validating the associated seat using a pessimistic write lock.
   * - Ensuring the seat is RESERVED.
   * - Validating the session exists.
   * - Updating the reservation and seat states.
   * - Creating and persisting the SaleEntity.
   * - Creating a SaleOutboxEntity for 'PaymentConfirmed'.
   * - Committing the transaction on success or rolling back on error.
   * - Logging the successful sale with outbox event creation.
   *
   * @async
   * @param {ICreateSalesInput} input The payload for creating a sale, including the reservation to confirm and user ID.
   * @returns {Promise<SaleEntity>} Returns the persisted sale entity.
   * @throws {NotFoundException} If the reservation, seat, or session is not found.
   * @throws {ForbiddenException} If the reservation does not belong to the user.
   * @throws {ConflictException} If the reservation is not pending or the seat is not reserved.
   * @throws {BadRequestException} If the reservation has expired.
   */
  public async execute(input: ICreateSalesInput): Promise<SaleEntity> {
    // Create a QueryRunner to manage manual transactions.
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { reservationId, userId }: ICreateSalesInput = input;

      // Step 1: Lock reservation row for update (pessimistic write lock)
      const reservation: Nullable<ReservationEntity> =
        await queryRunner.manager.findOne(ReservationEntity, {
          where: { id: reservationId },
          lock: { mode: 'pessimistic_write' },
        });

      // Step 2: Validate reservation
      if (!reservation) {
        throw new NotFoundException(
          this.i18n.t('common.reservation.notFoundWithId', {
            args: { id: reservationId },
          }),
        );
      }
      if (reservation.userId !== userId) {
        throw new ForbiddenException(
          this.i18n.t('common.sale.ownReservationsOnly'),
        );
      }
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new ConflictException(
          this.i18n.t('common.reservation.notPending', {
            args: { id: reservationId },
          }),
        );
      }
      if (new Date() > new Date(reservation.expiresAt)) {
        throw new BadRequestException(
          this.i18n.t('common.reservation.expired', {
            args: { id: reservationId },
          }),
        );
      }

      // Step 3: Lock seat row for update (pessimistic write lock)
      const seat: Nullable<SeatEntity> = await queryRunner.manager.findOne(
        SeatEntity,
        {
          where: { id: reservation.seatId },
          lock: { mode: 'pessimistic_write' },
        },
      );

      // Step 4: Validate seat
      // Seat must be RESERVED to allow confirmation; block if already SOLD or AVAILABLE
      if (!seat) {
        throw new NotFoundException(this.i18n.t('common.seat.notFound'));
      }
      if (seat.status !== SeatStatus.RESERVED) {
        throw new ConflictException(
          this.i18n.t('common.seat.notReservedForSale'),
        );
      }

      // Step 5: Validate session
      const session: Nullable<SessionEntity> =
        await queryRunner.manager.findOne(SessionEntity, {
          where: { id: reservation.sessionId },
        });
      if (!session) {
        throw new NotFoundException(
          this.i18n.t('common.session.notFoundWithId', {
            args: { id: reservation.sessionId },
          }),
        );
      }

      // Step 6: Update reservation and seat states
      reservation.status = ReservationStatus.CONFIRMED;
      seat.status = SeatStatus.SOLD;

      await queryRunner.manager.save([reservation, seat]);

      // Step 7: Create and persist sale entity
      const sale: SaleEntity = queryRunner.manager.create(SaleEntity, {
        reservationId,
        sessionId: reservation.sessionId,
        seatId: reservation.seatId,
        userId: reservation.userId,
        amount: session.ticketPrice,
      });
      const savedSale: SaleEntity = await queryRunner.manager.save(sale);

      // Step 8: Write outbox event for distributed consistency
      const outboxEvent: SaleOutboxEntity = queryRunner.manager.create(
        SaleOutboxEntity,
        {
          event: 'PaymentConfirmed',
          payload: {
            saleId: savedSale.id,
            reservationId,
            sessionId: reservation.sessionId,
            seatId: reservation.seatId,
            userId: reservation.userId,
            amount: session.ticketPrice,
          },
        },
      );
      await queryRunner.manager.save(outboxEvent);

      // Step 9: Commit transaction
      await queryRunner.commitTransaction();

      // Step 10: Log sale creation
      this.logger.log(`Sale ${savedSale.id} created with outbox event`);

      return savedSale;
    } catch (err) {
      // Roll back the transaction on error
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Release the database connection
      await queryRunner.release();
    }
  }
}

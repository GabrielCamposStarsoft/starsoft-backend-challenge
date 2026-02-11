// This use case handles the sale creation process. It performs the following steps, all within a transaction
// to ensure atomicity:
// 1. Locks the reservation row to avoid race-conditions (using pessimistic write lock),
//    ensuring no other sale can operate on the same reservation concurrently.
// 2. Checks if the reservation exists, is pending, and hasn't expired.
// 3. Locks the corresponding seat to prevent concurrent updates to its status (also pessimistic write lock).
// 4. Validates that the seat exists and is not already sold.
// 5. Checks if the session exists.
// 6. Updates the reservation status to CONFIRMED and the seat status to SOLD, committing both in the DB.
// 7. Creates and persists the sale entity with relevant details.
// 8. Creates an outbox event for 'PaymentConfirmed' to support eventual consistency patterns (e.g., distributed transactions).
// 9. Commits the transaction if everything passes, or rolls back in case of error.
// 10. Logs the completed sale.
// The operation uses manual QueryRunner to ensure all these steps are completed in a single transaction.

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

import { IUseCase, Nullable } from 'src/common';
import { ReservationEntity } from '../../reservations/entities';
import { ReservationStatus } from '../../reservations/enums';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import { SessionEntity } from '../../sessions/entities';
import { SaleEntity, SaleOutboxEntity } from '../entities';
import { ICreateSalesInput } from './interfaces';

@Injectable()
export class CreateSalesUseCase implements IUseCase<
  ICreateSalesInput,
  SaleEntity
> {
  private readonly logger: Logger = new Logger(CreateSalesUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Executes the sale creation process within a transaction, ensuring proper state validation and updates.
   * @param input The sale creation payload, including the reservation to confirm.
   * @returns The persisted SaleEntity.
   * @throws NotFoundException, ConflictException, BadRequestException on invalid state.
   */
  public async execute(input: ICreateSalesInput): Promise<SaleEntity> {
    // Create a QueryRunner to manage manual transactions
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
      if (!seat) {
        throw new NotFoundException(this.i18n.t('common.seat.notFound'));
      }
      if (seat.status === SeatStatus.SOLD) {
        throw new ConflictException(this.i18n.t('common.seat.alreadySold'));
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

      // Step 7: Create sale entry
      const sale: SaleEntity = queryRunner.manager.create(SaleEntity, {
        reservationId,
        sessionId: reservation.sessionId,
        seatId: reservation.seatId,
        userId: reservation.userId,
        amount: session.ticketPrice,
      });
      const savedSale: SaleEntity = await queryRunner.manager.save(sale);

      // Step 8: Write outbox event for distributed consistency
      const outboxEvent = queryRunner.manager.create(SaleOutboxEntity, {
        event: 'PaymentConfirmed',
        payload: {
          saleId: savedSale.id,
          reservationId,
          sessionId: reservation.sessionId,
          seatId: reservation.seatId,
          userId: reservation.userId,
          amount: session.ticketPrice,
        },
      });
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

/**
 * @fileoverview Use case for creating reservations.
 *
 * @usecase create-reservations-use-case
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import {
  MIN_SEATS_PER_SESSION,
  type IUseCase,
  type Nullable,
} from 'src/common';
import { DataSource, EntityManager, UpdateResult } from 'typeorm';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import { SessionEntity } from '../../sessions/entities';
import { SessionStatus } from '../../sessions/enums';
import { UserEntity } from '../../users/entities';
import { RESERVATION_TTL_MS } from '../constants';
import { ReservationEntity, ReservationOutboxEntity } from '../entities';
import { ReservationStatus } from '../enums';
import type { ICreateReservationsInput } from './interfaces';

/**
 * @class CreateReservationsUseCase
 * @implements {IUseCase<ICreateReservationsInput, Array<ReservationEntity>>}
 * @classdesc Use case for creating seat reservations for a session.
 *
 * - Ensures the session and user exist and are valid.
 * - Ensures selected seats are available before reserving.
 * - Updates seat status, creates reservations, and outbox entries (for async relay).
 *
 * @throws {NotFoundException} If session/user/seat does not exist.
 * @throws {BadRequestException} If session is not active or seat is not in session.
 * @throws {ConflictException} If seat is not available for reservation.
 */
@Injectable()
export class CreateReservationsUseCase implements IUseCase<
  ICreateReservationsInput,
  Array<ReservationEntity>
> {
  /**
   * @private
   * @readonly
   * @type {Logger}
   * Logger instance for this use case.
   */
  private readonly logger: Logger = new Logger(CreateReservationsUseCase.name);

  /**
   * Creates an instance of CreateReservationsUseCase.
   *
   * @constructor
   * @param {DataSource} dataSource - TypeORM data source for transactional operations.
   * @param {I18nService} i18n - i18n service for localizable error messages.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Attempts to reserve a batch of seats for a user in a session atomically.
   * All operations are performed within a single transaction.
   *
   * @async
   * @param {ICreateReservationsInput} input - Reservation input containing sessionId, seatIds, and userId.
   * @returns {Promise<Array<ReservationEntity>>} Array of created ReservationEntity objects.
   *
   * @throws {NotFoundException} If session/user/seat not found.
   * @throws {BadRequestException} If session not active or seat not in session.
   * @throws {ConflictException} If seat is not available for reservation.
   */
  public async execute(
    input: ICreateReservationsInput,
  ): Promise<Array<ReservationEntity>> {
    const { sessionId, seatIds, userId }: ICreateReservationsInput = input;

    // All operations done within a transactional boundary
    return this.dataSource.transaction(async (manager: EntityManager) => {
      /**
       * Validate session existence and activity.
       * @type {Nullable<SessionEntity>}
       */
      const session: Nullable<SessionEntity> = await manager.findOne(
        SessionEntity,
        {
          where: { id: sessionId },
        },
      );
      if (!session) {
        throw new NotFoundException(
          this.i18n.t('common.session.notFoundWithId', {
            args: { id: sessionId },
          }),
        );
      }
      if (session.status !== SessionStatus.ACTIVE) {
        throw new BadRequestException(this.i18n.t('common.session.notActive'));
      }

      /**
       * Validate session has minimum required seats (business rule: min 16).
       */
      const seatCount: number = await manager.count(SeatEntity, {
        where: { sessionId },
      });
      if (seatCount < MIN_SEATS_PER_SESSION) {
        throw new BadRequestException(
          this.i18n.t('common.session.minSeatsRequired', {
            args: { min: MIN_SEATS_PER_SESSION, count: seatCount },
          }),
        );
      }

      /**
       * Validate user existence.
       * @type {Nullable<UserEntity>}
       */
      const user: Nullable<UserEntity> = await manager.findOne(UserEntity, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(
          this.i18n.t('common.user.notFound', { args: { id: userId } }),
        );
      }

      /**
       * Sort seatIds to ensure deterministic locking/acquisition order.
       * @type {Array<string>}
       */
      const sortedSeatIds: Array<string> = [...seatIds].sort();

      /**
       * Holds the created reservations.
       * @type {Array<ReservationEntity>}
       */
      const reservations: Array<ReservationEntity> = [];

      /**
       * Reservation expiration date.
       * @type {Date}
       */
      const expiresAt: Date = new Date(Date.now() + RESERVATION_TTL_MS);

      // For each seat, try to reserve
      for (const seatId of sortedSeatIds) {
        /**
         * Attempt atomic update to reserve the seat if it's available.
         * @type {UpdateResult}
         */
        const updateResult: UpdateResult = await manager
          .createQueryBuilder()
          .update(SeatEntity)
          .set({
            status: SeatStatus.RESERVED,
            version: () => 'version + 1',
          })
          .where('id = :seatId', { seatId })
          .andWhere('session_id = :sessionId', { sessionId })
          .andWhere('status = :status', { status: SeatStatus.AVAILABLE })
          .execute();

        if (updateResult.affected === 0) {
          /**
           * Seat was not updated (not available). Find out why.
           * @type {Nullable<SeatEntity>}
           */
          const seat: Nullable<SeatEntity> = await manager.findOne(SeatEntity, {
            where: { id: seatId },
            select: ['id', 'sessionId', 'status'],
          });
          if (!seat) {
            throw new NotFoundException(this.i18n.t('common.seat.notFound'));
          }
          if (seat.sessionId !== sessionId) {
            throw new BadRequestException(
              this.i18n.t('common.seat.notInSession', {
                args: { id: seatId },
              }),
            );
          }
          throw new ConflictException(
            this.i18n.t('common.seat.notAvailable', { args: { id: seatId } }),
          );
        }

        /**
         * Create the reservation.
         * @type {ReservationEntity}
         */
        const reservation: ReservationEntity = manager.create(
          ReservationEntity,
          {
            sessionId,
            seatId,
            userId,
            status: ReservationStatus.PENDING,
            expiresAt,
          },
        );

        await manager.save(reservation);
        reservations.push(reservation);

        /**
         * Create an outbox entry for async relay of "reservation created" event.
         * @type {ReservationOutboxEntity}
         */
        const outboxEntry: ReservationOutboxEntity = manager.create(
          ReservationOutboxEntity,
          {
            reservationId: reservation.id,
            seatId: reservation.seatId,
            sessionId: reservation.sessionId,
            userId: reservation.userId,
            expiresAt: reservation.expiresAt,
            published: false,
          },
        );

        await manager.save(outboxEntry);

        this.logger.log(
          `Reservation ${reservation.id} created for seat ${seatId} (expires at ${expiresAt.toISOString()})`,
        );
      }

      return reservations;
    });
  }
}

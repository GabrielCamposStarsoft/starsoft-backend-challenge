import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase, Nullable } from 'src/common';
import { DataSource, EntityManager, UpdateResult } from 'typeorm';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import { SessionEntity } from '../../sessions/entities';
import { UserEntity } from '../../users/entities';
import { RESERVATION_TTL_MS } from '../constants';
import { ReservationEntity, ReservationOutboxEntity } from '../entities';
import { ReservationStatus } from '../enums';
import type { ICreateReservationsInput } from './interfaces';

@Injectable()
export class CreateReservationsUseCase implements IUseCase<
  ICreateReservationsInput,
  Array<ReservationEntity>
> {
  private readonly logger: Logger = new Logger(CreateReservationsUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  public async execute(
    input: ICreateReservationsInput,
  ): Promise<Array<ReservationEntity>> {
    const { sessionId, seatIds, userId }: ICreateReservationsInput = input;

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const session: Nullable<SessionEntity> = await manager.findOne(
        SessionEntity,
        {
          where: { id: sessionId },
        },
      );
      if (!session)
        throw new NotFoundException(
          this.i18n.t('common.session.notFoundWithId', {
            args: { id: sessionId },
          }),
        );

      const user: Nullable<UserEntity> = await manager.findOne(UserEntity, {
        where: { id: userId },
      });

      if (!user)
        throw new NotFoundException(
          this.i18n.t('common.user.notFound', { args: { id: userId } }),
        );

      const sortedSeatIds: Array<string> = [...seatIds].sort();
      const reservations: Array<ReservationEntity> = [];
      const expiresAt: Date = new Date(Date.now() + RESERVATION_TTL_MS);

      for (const seatId of sortedSeatIds) {
        const updateResult: UpdateResult = await manager
          .createQueryBuilder()
          .update(SeatEntity)
          .set({ status: SeatStatus.RESERVED })
          .where('id = :seatId', { seatId })
          .andWhere('session_id = :sessionId', { sessionId })
          .andWhere('status = :status', { status: SeatStatus.AVAILABLE })
          .execute();

        if (updateResult.affected === 0) {
          throw new ConflictException(
            this.i18n.t('common.seat.notAvailable', { args: { id: seatId } }),
          );
        }

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

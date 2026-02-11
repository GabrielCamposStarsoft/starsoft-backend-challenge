import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DataSource } from 'typeorm';
import { ReservationEntity } from '../entities';
import { SeatEntity } from '../../seats/entities';
import { ReservationStatus } from '../enums';
import { SeatStatus } from '../../seats/enums';
import { MessagingProducer } from '../../../core/messaging/producers/messaging.producer';
import { UpdateReservationsDto } from '../dto';
import { Nullable } from 'src/common';

const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [
    ReservationStatus.CONFIRMED,
    ReservationStatus.EXPIRED,
    ReservationStatus.CANCELLED,
  ],
  [ReservationStatus.CONFIRMED]: [],
  [ReservationStatus.EXPIRED]: [],
  [ReservationStatus.CANCELLED]: [],
};

@Injectable()
export class UpdateReservationsUseCase {
  private readonly logger: Logger = new Logger(UpdateReservationsUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly messagingProducer: MessagingProducer,
    private readonly i18n: I18nService,
  ) {}

  public async execute(
    id: string,
    updateDto: UpdateReservationsDto,
  ): Promise<ReservationEntity> {
    return this.dataSource.transaction(async (manager) => {
      const reservation = await manager.findOne(ReservationEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) {
        throw new NotFoundException(
          this.i18n.t('common.reservation.notFoundWithId', { args: { id } }),
        );
      }

      if (updateDto.status !== undefined) {
        const allowed: Array<ReservationStatus> =
          VALID_TRANSITIONS[reservation.status];

        if (!allowed.includes(updateDto?.status ?? ReservationStatus.PENDING)) {
          throw new ConflictException(
            this.i18n.t('common.reservation.invalidTransition', {
              args: {
                from: reservation.status,
                to: String(updateDto?.status ?? ''),
              },
            }),
          );
        }

        if (updateDto.status === ReservationStatus.CANCELLED) {
          const seat: Nullable<SeatEntity> = await manager.findOne(SeatEntity, {
            where: { id: reservation.seatId },
          });
          if (seat && seat.status === SeatStatus.RESERVED) {
            seat.status = SeatStatus.AVAILABLE;
            await manager.save(seat);
          }

          await this.messagingProducer.publishSeatReleased({
            seatId: reservation.seatId,
            sessionId: reservation.sessionId,
            reason: 'cancelled',
          });
        }

        if (updateDto.status === ReservationStatus.EXPIRED) {
          const seat = await manager.findOne(SeatEntity, {
            where: { id: reservation.seatId },
          });
          if (seat && seat.status === SeatStatus.RESERVED) {
            seat.status = SeatStatus.AVAILABLE;
            await manager.save(seat);
          }

          await this.messagingProducer.publishReservationExpired({
            reservationId: reservation.id,
            seatId: reservation.seatId,
            sessionId: reservation.sessionId,
          });

          await this.messagingProducer.publishSeatReleased({
            seatId: reservation.seatId,
            sessionId: reservation.sessionId,
            reason: 'expired',
          });
        }
      }

      Object.assign(reservation, updateDto);
      const updated = await manager.save(reservation);

      this.logger.log(`Reservation ${id} updated`);

      return updated;
    });
  }
}

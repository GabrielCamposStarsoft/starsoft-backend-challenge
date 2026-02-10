import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MessagingProducer } from '../../../core/messaging/producers/messaging.producer';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import { ReservationEntity } from '../entities';
import { ReservationStatus } from '../enums';
import type { IDeleteReservationsInput } from './interfaces';
import { IUseCase } from 'src/common';

@Injectable()
export class DeleteReservationsUseCase implements IUseCase<
  IDeleteReservationsInput,
  void
> {
  private readonly logger: Logger = new Logger(DeleteReservationsUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly messagingProducer: MessagingProducer,
  ) {}

  public async execute(input: IDeleteReservationsInput): Promise<void> {
    const { id }: IDeleteReservationsInput = input;

    await this.dataSource.transaction(async (manager) => {
      const reservation = await manager.findOne(ReservationEntity, {
        where: { id },
      });
      if (!reservation) {
        this.logger.error(`Reservation not found with id: ${id}`);
        throw new NotFoundException('Reservation not found');
      }

      if (reservation.status === ReservationStatus.CONFIRMED) {
        throw new ConflictException(
          'Cannot delete a confirmed reservation (already sold)',
        );
      }

      if (reservation.status === ReservationStatus.PENDING) {
        const seat = await manager.findOne(SeatEntity, {
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

      await manager.delete(ReservationEntity, { id });
    });

    this.logger.log(`Reservation ${id} deleted and seat released`);
  }
}

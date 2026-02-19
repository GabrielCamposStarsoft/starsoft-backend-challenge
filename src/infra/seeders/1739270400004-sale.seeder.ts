/**
 * @fileoverview Sale seeder for development data.
 *
 * Creates confirmed reservations and converts them to sales for the first session.
 *
 * @seeder sale-seeder
 */

import type { Nullable } from 'src/common';
import type { DataSource, Repository } from 'typeorm';
import type { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { ReservationEntity } from '../../modules/reservations/entities';
import { ReservationStatus } from '../../modules/reservations/enums';
import { SaleEntity } from '../../modules/sales/entities';
import { SeatEntity } from '../../modules/seats/entities';
import { SeatStatus } from '../../modules/seats/enums';
import { SessionEntity } from '../../modules/sessions/entities';
import { UserEntity } from '../../modules/users/entities';

/**
 * Seeds the sales table with completed purchases.
 */
export class SaleSeeder1739270400004 implements Seeder {
  /**
   * Creates 10 confirmed reservations, converts to sales, marks seats sold.
   *
   * @param dataSource - TypeORM DataSource
   * @param _factoryManager - Unused
   */
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const userRepo: Repository<UserEntity> =
      dataSource.getRepository(UserEntity);
    const sessionRepo: Repository<SessionEntity> =
      dataSource.getRepository(SessionEntity);
    const seatRepo: Repository<SeatEntity> =
      dataSource.getRepository(SeatEntity);
    const reservationRepo: Repository<ReservationEntity> =
      dataSource.getRepository(ReservationEntity);
    const saleRepo: Repository<SaleEntity> =
      dataSource.getRepository(SaleEntity);

    const users: Array<UserEntity> = await userRepo.find({ take: 10 });
    const sessions: Array<SessionEntity> = await sessionRepo.find({ take: 10 });
    const [session]: Array<SessionEntity> = sessions;
    if (session == null) return;

    const availableSeats: Array<SeatEntity> = await seatRepo.find({
      where: { sessionId: session.id, status: SeatStatus.AVAILABLE },
      take: 10,
    });
    if (availableSeats.length < 10) return;

    const expiresAt: Date = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60);

    const reservationsToSave: Array<ReservationEntity> = availableSeats
      .slice(0, 10)
      .map((seat: SeatEntity, i: number) =>
        reservationRepo.create({
          sessionId: session.id,
          seatId: seat.id,
          userId: users[i]?.id ?? users[0].id,
          status: ReservationStatus.CONFIRMED,
          expiresAt,
        }),
      );

    const savedReservations: Array<ReservationEntity> =
      await reservationRepo.save(reservationsToSave);
    const sessionWithPrice: Nullable<SessionEntity> = await sessionRepo.findOne(
      {
        where: { id: session.id },
      },
    );
    const ticketPrice: number = Number(sessionWithPrice?.ticketPrice ?? 25);

    const sales: Array<
      Pick<
        SaleEntity,
        'reservationId' | 'sessionId' | 'seatId' | 'userId' | 'amount'
      >
    > = savedReservations.map((reservation: ReservationEntity) => ({
      reservationId: reservation.id,
      sessionId: session.id,
      seatId: reservation.seatId,
      userId: reservation.userId,
      amount: ticketPrice,
    }));

    await saleRepo.insert(sales);

    for (const seat of availableSeats.slice(0, 10)) {
      await seatRepo.update({ id: seat.id }, { status: SeatStatus.SOLD });
    }
  }
}

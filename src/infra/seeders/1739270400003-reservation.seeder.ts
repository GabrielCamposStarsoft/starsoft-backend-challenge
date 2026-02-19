/**
 * @fileoverview Reservation seeder for development data.
 *
 * Creates 10 pending reservations for the first session's available seats.
 *
 * @seeder reservation-seeder
 */

import type { DataSource, Repository } from 'typeorm';
import type { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { ReservationEntity } from '../../modules/reservations/entities';
import { ReservationStatus } from '../../modules/reservations/enums';
import { SeatEntity } from '../../modules/seats/entities';
import { SeatStatus } from '../../modules/seats/enums';
import { SessionEntity } from '../../modules/sessions/entities';
import { UserEntity } from '../../modules/users/entities';

/**
 * Seeds the reservations table with pending reservations.
 */
export class ReservationSeeder1739270400003 implements Seeder {
  /**
   * Inserts 10 pending reservations and marks seats as reserved.
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

    const users: Array<UserEntity> = await userRepo.find({ take: 10 });
    const [session]: Array<SessionEntity> = await sessionRepo.find({ take: 1 });
    const seats: Array<SeatEntity> = await seatRepo.find({
      where: { sessionId: session?.id, status: SeatStatus.AVAILABLE },
      take: 10,
    });

    if (session == null || seats.length < 10) return;

    const expiresAt: Date = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const reservations: Array<
      Pick<
        ReservationEntity,
        'sessionId' | 'seatId' | 'userId' | 'status' | 'expiresAt'
      >
    > = seats.slice(0, 10).map((seat: SeatEntity, i: number) => ({
      sessionId: session.id,
      seatId: seat.id,
      userId: users[i]?.id ?? users[0].id,
      status: ReservationStatus.PENDING,
      expiresAt,
    }));

    await reservationRepo.insert(reservations);

    for (const seat of seats.slice(0, 10)) {
      await seatRepo.update({ id: seat.id }, { status: SeatStatus.RESERVED });
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IUseCase, Nullable } from 'src/common';
import {
  DataSource,
  LessThanOrEqual,
  Repository,
  UpdateResult,
  type QueryRunner,
} from 'typeorm';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import { BATCH_SIZE } from '../constants';
import {
  ReservationEntity,
  ReservationExpirationOutboxEntity,
} from '../entities';
import { ReservationStatus } from '../enums';

@Injectable()
export class ExpireReservationsUseCase implements IUseCase<Date, void> {
  private readonly logger: Logger = new Logger(ExpireReservationsUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ReservationEntity)
    private readonly reservationsRepository: Repository<ReservationEntity>,
  ) {}

  public async execute(now: Date = new Date()): Promise<void> {
    const expiredReservations: Array<ReservationEntity> =
      await this.reservationsRepository.find({
        where: {
          status: ReservationStatus.PENDING,
          expiresAt: LessThanOrEqual(now),
        },
        take: BATCH_SIZE,
        order: { expiresAt: 'ASC' },
      });

    let expiredCount: number = 0;

    for (const reservation of expiredReservations) {
      const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const locked: Nullable<ReservationEntity> =
          await queryRunner.manager.findOne(ReservationEntity, {
            where: {
              id: reservation.id,
              status: ReservationStatus.PENDING,
            },
            lock: { mode: 'pessimistic_write' },
          });

        if (!locked) {
          await queryRunner.rollbackTransaction();
          continue;
        }

        await queryRunner.manager.update(
          ReservationEntity,
          { id: reservation.id, status: ReservationStatus.PENDING },
          { status: ReservationStatus.EXPIRED },
        );

        const seatUpdateResult: UpdateResult = await queryRunner.manager
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

        const seatReleased: boolean = (seatUpdateResult.affected ?? 0) > 0;

        await queryRunner.manager.insert(ReservationExpirationOutboxEntity, {
          reservationId: reservation.id,
          seatId: reservation.seatId,
          sessionId: reservation.sessionId,
          seatReleased,
          published: false,
        });

        await queryRunner.commitTransaction();
        expiredCount += 1;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.warn(
          `Failed to expire reservation ${reservation.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        await queryRunner.release();
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} reservations`);
    }
  }
}

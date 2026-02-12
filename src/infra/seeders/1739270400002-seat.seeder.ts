/**
 * @fileoverview Seat seeder for development data.
 *
 * Creates 20 seats (A1-A10, B1-B10) for the first session.
 *
 * @seeder seat-seeder
 */

import type { DataSource, Repository } from 'typeorm';
import type { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { SeatEntity } from '../../modules/seats/entities';
import { SeatStatus } from '../../modules/seats/enums';
import { SessionEntity } from '../../modules/sessions/entities';

/**
 * Seeds the seats table for the first session.
 */
export class SeatSeeder1739270400002 implements Seeder {
  /**
   * Inserts 20 available seats for the first session.
   *
   * @param dataSource - TypeORM DataSource
   * @param _factoryManager - Unused
   */
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const sessionRepo: Repository<SessionEntity> =
      dataSource.getRepository(SessionEntity);
    const seatRepo: Repository<SeatEntity> =
      dataSource.getRepository(SeatEntity);
    const [firstSession] = await sessionRepo.find({ take: 1 });
    if (firstSession == null) return;

    const labels: Array<string> = [
      'A1',
      'A2',
      'A3',
      'A4',
      'A5',
      'A6',
      'A7',
      'A8',
      'A9',
      'A10',
      'B1',
      'B2',
      'B3',
      'B4',
      'B5',
      'B6',
      'B7',
      'B8',
      'B9',
      'B10',
    ];
    await seatRepo.insert(
      labels.map((label: string) => ({
        sessionId: firstSession.id,
        label,
        status: SeatStatus.AVAILABLE,
      })),
    );
  }
}

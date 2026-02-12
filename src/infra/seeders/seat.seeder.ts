import type { DataSource, Repository } from 'typeorm';
import type { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { SeatEntity } from '../../modules/seats/entities';
import { SeatStatus } from '../../modules/seats/enums';
import { SessionEntity } from '../../modules/sessions/entities';

export class SeatSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const sessionRepo: Repository<SessionEntity> =
      dataSource.getRepository(SessionEntity);
    const seatRepo: Repository<SeatEntity> =
      dataSource.getRepository(SeatEntity);
    const [firstSession]: Array<SessionEntity> = await sessionRepo.find({
      take: 1,
    });
    if (firstSession == null) return;

    const labels: Array<string> = [
      'A1',
      'A2',
      'A3',
      'A4',
      'A5',
      'B1',
      'B2',
      'B3',
      'B4',
      'B5',
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

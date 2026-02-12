/**
 * @fileoverview Session seeder for development data.
 *
 * Inserts 10 movie sessions into the first room with staggered times.
 *
 * @seeder session-seeder
 */

import type { DataSource } from 'typeorm';
import type { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { SessionEntity } from '../../modules/sessions/entities';
import { SessionStatus } from '../../modules/sessions/enums';

/**
 * Seeds the sessions table with sample movie screenings.
 */
export class SessionSeeder1739270400001 implements Seeder {
  /**
   * Inserts 10 sessions with Inception, Matrix, etc.
   *
   * @param dataSource - TypeORM DataSource
   * @param _factoryManager - Unused
   */
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repo = dataSource.getRepository(SessionEntity);
    const now = new Date();
    const sessions = [
      { movieTitle: 'Inception', roomName: 'Room 1', ticketPrice: 25.5 },
      { movieTitle: 'The Matrix', roomName: 'Room 2', ticketPrice: 22.0 },
      { movieTitle: 'Interstellar', roomName: 'Room 1', ticketPrice: 28.0 },
      { movieTitle: 'Avatar', roomName: 'Room 3', ticketPrice: 30.0 },
      { movieTitle: 'Gladiator', roomName: 'Room 2', ticketPrice: 20.0 },
      { movieTitle: 'Titanic', roomName: 'Room 1', ticketPrice: 24.0 },
      { movieTitle: 'The Dark Knight', roomName: 'Room 2', ticketPrice: 26.0 },
      { movieTitle: 'Pulp Fiction', roomName: 'Room 3', ticketPrice: 21.0 },
      { movieTitle: 'Forrest Gump', roomName: 'Room 1', ticketPrice: 23.0 },
      { movieTitle: 'Fight Club', roomName: 'Room 2', ticketPrice: 25.0 },
    ];
    const rows = sessions.map((s, i) => {
      const start = new Date(now);
      start.setDate(start.getDate() + i);
      start.setHours(19 + (i % 3), 0, 0, 0);
      const end = new Date(start);
      end.setHours(end.getHours() + 2, 30, 0, 0);
      return {
        movieTitle: s.movieTitle,
        roomName: s.roomName,
        startTime: start,
        endTime: end,
        ticketPrice: s.ticketPrice,
        status: SessionStatus.ACTIVE,
      };
    });
    await repo.insert(rows);
  }
}

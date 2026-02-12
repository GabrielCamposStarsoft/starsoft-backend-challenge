/**
 * @fileoverview CLI entry point for database seeding.
 *
 * Initializes TypeORM DataSource, runs all seeders in order (users, sessions,
 * seats, reservations, sales), then exits. Used for development/bootstrap.
 *
 * @script seed-run
 */

import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { runSeeders } from 'typeorm-extension';
import dataSource from '../../../data-source.config';
import { UserSeeder1739270400000 } from './1739270400000-user.seeder';
import { SessionSeeder1739270400001 } from './1739270400001-session.seeder';
import { SeatSeeder1739270400002 } from './1739270400002-seat.seeder';
import { ReservationSeeder1739270400003 } from './1739270400003-reservation.seeder';
import { SaleSeeder1739270400004 } from './1739270400004-sale.seeder';

(async (): Promise<void> => {
  await dataSource.initialize();

  await runSeeders(dataSource, {
    seeds: [
      UserSeeder1739270400000,
      SessionSeeder1739270400001,
      SeatSeeder1739270400002,
      ReservationSeeder1739270400003,
      SaleSeeder1739270400004,
    ],
    factories: [],
  });

  await dataSource.destroy();
  Logger.log('Seed completed', 'Seed');
  process.exit(0);
})().catch((error: unknown) => {
  const message: string =
    error instanceof Error ? error.message : String(error);
  Logger.error(message, 'Seed');
  process.exit(1);
});

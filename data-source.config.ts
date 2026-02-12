/**
 * @fileoverview TypeORM DataSource for CLI migrations.
 *
 * Exported DataSource used by TypeORM CLI (typeorm migration:run, etc.).
 * Shares database options with the application via config/database-options.
 * Entities and migrations paths point to src for both .ts and .js (compiled).
 *
 * @config data-source
 */

import { DataSource } from 'typeorm';
import { join as joinPath } from 'path';
import { typeOrmConnectionOptions } from './database-options';

export default new DataSource({
  ...typeOrmConnectionOptions,
  entities: [joinPath(__dirname, 'src', '**', '*.entity{.ts,.js}')],
  migrations: [
    joinPath(__dirname, 'src', 'infra', 'migrations', '*.ts'),
    joinPath(__dirname, 'src', 'infra', 'migrations', '*.js'),
  ],
  synchronize: false,
});

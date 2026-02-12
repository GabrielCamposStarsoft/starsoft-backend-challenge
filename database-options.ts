/**
 * @fileoverview Database connection configuration for TypeORM.
 *
 * Single source of truth for PostgreSQL connection options. Consumed by:
 * - App bootstrap (TypeOrmModule.forRoot in app.module.ts)
 * - CLI migrations (data-source.config.ts)
 *
 * Values are read from env vars with local-development defaults.
 * dotenv is loaded to ensure .env is parsed before accessing process.env.
 *
 * @config database-options
 */

import 'dotenv/config';
import type { DataSourceOptions } from 'typeorm';

/**
 * TypeORM DataSource options for PostgreSQL.
 *
 * @description Host, port, user, password, and database name. No SSL or pool
 * tuning here; extend if needed for production.
 *
 * @constant
 * @type {DataSourceOptions}
 */
export const typeOrmConnectionOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'cinema',
} as const;

/**
 * Test database utilities.
 * Provides DataSource for test database and migration runner.
 * Must run migrations before integration/e2e tests.
 * Setup files apply test env before tests run.
 */
import { DataSource } from 'typeorm';
import { join } from 'path';
import { TEST_ENV } from './test-env';
import type { Nullable } from 'src/common';

export const testDataSourceOptions = {
  type: 'postgres' as const,
  host: TEST_ENV.DATABASE_HOST,
  port: parseInt(TEST_ENV.DATABASE_PORT, 10),
  username: TEST_ENV.DATABASE_USER,
  password: TEST_ENV.DATABASE_PASSWORD,
  database: TEST_ENV.DATABASE_NAME,
  synchronize: false,
  logging: false,
  entities: [join(__dirname, '..', '..', 'src', '**', '*.entity{.ts,.js}')],
  migrations: [
    join(__dirname, '../../src/infra/migrations/*.ts'),
    join(__dirname, '../../src/infra/migrations/*.js'),
  ],
};

let testDataSource: DataSource | null = null;

/**
 * Get or create the test DataSource.
 */
export async function getTestDataSource(): Promise<DataSource> {
  if (testDataSource?.isInitialized ?? false) {
    return testDataSource as DataSource;
  }
  testDataSource = new DataSource(testDataSourceOptions);
  await testDataSource.initialize();
  return testDataSource;
}

/**
 * Run migrations on the test database.
 */
export async function runTestMigrations(): Promise<void> {
  const ds = await getTestDataSource();
  await ds.runMigrations();
}

/**
 * Revert all migrations (for full cleanup between test runs if needed).
 */
export async function revertTestMigrations(): Promise<void> {
  const ds = await getTestDataSource();
  await ds.undoLastMigration();
}

/**
 * Close the test DataSource.
 */
export async function closeTestDataSource(): Promise<void> {
  if (testDataSource?.isInitialized ?? false) {
    await (testDataSource as Nullable<DataSource>)?.destroy();
    testDataSource = null;
  }
}

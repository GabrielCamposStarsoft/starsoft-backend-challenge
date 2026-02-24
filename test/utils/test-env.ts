/**
 * Test environment configuration.
 * Overrides process.env for test infrastructure (docker-compose.test.yml).
 * Ensure docker compose -f docker/compose.test.yml is running before tests.
 */
export const TEST_ENV = {
  DATABASE_HOST: process.env.TEST_DATABASE_HOST ?? 'localhost',
  DATABASE_PORT: process.env.TEST_DATABASE_PORT ?? '5433',
  DATABASE_USER: process.env.TEST_DATABASE_USER ?? 'postgres',
  DATABASE_PASSWORD: process.env.TEST_DATABASE_PASSWORD ?? 'postgres',
  DATABASE_NAME: process.env.TEST_DATABASE_NAME ?? 'cinema_test',
  VALKEY_URL: process.env.TEST_VALKEY_URL ?? 'redis://localhost:6380',
  RMQ_URL: process.env.TEST_RMQ_URL ?? 'amqp://guest:guest@localhost:5673',
  RESERVATION_TTL_MS: '5000', // Shorter TTL for faster expiration tests
};

/**
 * Apply test environment variables. Call before bootstrapping app or DataSource.
 */
export function applyTestEnv(): void {
  process.env.DATABASE_HOST = TEST_ENV.DATABASE_HOST;
  process.env.DATABASE_PORT = TEST_ENV.DATABASE_PORT;
  process.env.DATABASE_USER = TEST_ENV.DATABASE_USER;
  process.env.DATABASE_PASSWORD = TEST_ENV.DATABASE_PASSWORD;
  process.env.DATABASE_NAME = TEST_ENV.DATABASE_NAME;
  process.env.VALKEY_URL = TEST_ENV.VALKEY_URL;
  process.env.RMQ_URL = TEST_ENV.RMQ_URL;
  process.env.RESERVATION_TTL_MS = TEST_ENV.RESERVATION_TTL_MS;
}

/**
 * @fileoverview Redis provider for dependency injection.
 *
 * Exports a NestJS provider that supplies a singleton Redis client instance
 * (ioredis) throughout the application. Connection URL is taken from
 * VALKEY_URL environment variable, defaulting to local Redis if unset.
 *
 * @provider common/providers/redis.provider
 */

import type { Provider } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * RedisProvider: NestJS provider for ioredis instances.
 *
 * - Provides the Redis client under the injection token 'REDIS'.
 * - Uses VALKEY_URL environment variable, falling back to 'redis://localhost:6379'.
 *
 * @constant
 */
export const RedisProvider: Provider<Redis> = {
  provide: 'REDIS',
  /**
   * Factory function to create a Redis instance.
   * @returns {Redis} ioredis client instance.
   */
  useFactory: (): Redis =>
    new Redis(process.env.VALKEY_URL ?? 'redis://localhost:6379'),
};

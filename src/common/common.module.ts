/**
 * @fileoverview Shared NestJS module for cross-cutting concerns.
 *
 * Registered globally so its providers are available in all feature modules.
 * Provides distributed locking (Redis), log execution, and distributed lock interceptors.
 *
 * @module common
 */

import { Global, Module } from '@nestjs/common';
import { DistributedLockService } from './services';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';
import { RedisProvider } from './providers';

@Global()
@Module({
  providers: [
    RedisProvider,
    DistributedLockService,
    IdempotencyInterceptor,
  ],
  exports: [
    RedisProvider,
    DistributedLockService,
    IdempotencyInterceptor,
  ],
})
/**
 * Global module exposing DistributedLockService and IdempotencyInterceptor.
 *
 * @description Exports DistributedLockService for use in schedulers
 * that need Redis-backed locks. IdempotencyInterceptor is registered
 * for use with @UseInterceptors on HTTP handlers.
 */
export class CommonModule {}

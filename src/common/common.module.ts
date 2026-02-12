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
import { DistributedLockInterceptor } from './interceptors/distributed-lock.interceptor';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';
import { LogExecutionInterceptor } from './interceptors/log-execution.interceptor';
import { RedisProvider } from './providers';

@Global()
@Module({
  providers: [
    RedisProvider,
    DistributedLockService,
    DistributedLockInterceptor,
    LogExecutionInterceptor,
    IdempotencyInterceptor,
  ],
  exports: [RedisProvider, DistributedLockService, IdempotencyInterceptor],
})
/**
 * Global module exposing DistributedLockService and interceptors.
 *
 * @description Exports DistributedLockService for use in controllers/services
 * that need Redis-backed locks. Interceptors are registered as providers
 * for use with @UseInterceptors.
 */
export class CommonModule {}

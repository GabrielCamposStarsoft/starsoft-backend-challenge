/**
 * @fileoverview Decorator for distributed locking via Redis/Redlock.
 *
 * Ensures only one handler execution across the cluster for a given lock key.
 * Used by schedulers and other singleton jobs to prevent duplicate processing.
 *
 * @decorator distributed-lock
 */

import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { DISTRIBUTED_LOCK_KEY, DISTRIBUTED_LOCK_TTL } from '../constants';
import { DistributedLockInterceptor } from '../interceptors';

/**
 * Wraps a handler with a distributed lock so only one instance executes.
 *
 * @description Acquires a Redis lock before execution. If lock cannot be acquired,
 * the interceptor returns undefined without running the handler. Lock TTL prevents
 * deadlocks from crashed processes.
 *
 * @param key - Unique lock resource identifier (e.g. 'lock:reservation-expiration')
 * @param ttlSeconds - Lock TTL in seconds; must exceed expected handler duration
 * @returns {MethodDecorator & ClassDecorator}
 *
 * @example
 * @DistributedLock('lock:my-job', 55)
 * async handleJob() {
 *   await this.doWork();
 * }
 */
export const DistributedLock = (
  key: string,
  ttlSeconds: number,
): MethodDecorator & ClassDecorator => {
  return applyDecorators(
    SetMetadata(DISTRIBUTED_LOCK_KEY, key),
    SetMetadata(DISTRIBUTED_LOCK_TTL, ttlSeconds),
    UseInterceptors(DistributedLockInterceptor),
  );
};

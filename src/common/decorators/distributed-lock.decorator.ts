import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { DistributedLockInterceptor } from '../interceptors';
import { DISTRIBUTED_LOCK_KEY, DISTRIBUTED_LOCK_TTL } from '../constants';

/**
 * Decorator that wraps a method with a distributed lock (Redlock).
 * Only one instance across the cluster will execute the method; others skip (return undefined).
 *
 * @param key - Lock resource key (e.g. 'lock:reservation-expiration')
 * @param ttlSeconds - Lock TTL in seconds; lock auto-expires to avoid deadlock
 *
 * @example
 * ```ts
 * @DistributedLock('lock:my-job', 55)
 * async handleJob() {
 *   await this.doWork();
 * }
 * ```
 */
export function DistributedLock(
  key: string,
  ttlSeconds: number,
): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(DISTRIBUTED_LOCK_KEY, key),
    SetMetadata(DISTRIBUTED_LOCK_TTL, ttlSeconds),
    UseInterceptors(DistributedLockInterceptor),
  );
}

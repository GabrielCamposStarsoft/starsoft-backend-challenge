import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DistributedLockService } from '../services/distributed-lock.service';
import { DISTRIBUTED_LOCK_KEY, DISTRIBUTED_LOCK_TTL } from '../constants';
import { Optional } from '../types';

/**
 * Interceptor that applies distributed locking to route handlers using the DistributedLock decorator.
 *
 * This interceptor checks for the presence of DistributedLock metadata (lock key and TTL)
 * on the route handler. If present, it attempts to acquire a distributed lock before continuing.
 * - If the lock is acquired, it proceeds with handler execution and releases the lock upon completion.
 * - If the lock is not acquired, it short-circuits the pipeline and does not call the handler.
 *
 * @see ../decorators/distributed-lock.decorator.ts
 */
@Injectable()
export class DistributedLockInterceptor implements NestInterceptor {
  /**
   * Constructs the DistributedLockInterceptor.
   *
   * @param reflector Used to read custom DistributedLock metadata from the handler.
   * @param lockService The distributed locking service (e.g., backed by Redis).
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Intercepts incoming requests to check for DistributedLock metadata.
   * If a lock key and TTL are defined, attempts to acquire the lock. If acquisition fails,
   * further execution is halted. The lock is always released when handler completes.
   *
   * @param context The current execution context.
   * @param next The next handler in the pipeline.
   * @returns Observable emitting handler result or undefined if lock was not acquired.
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    /**
     * Retrieves the DistributedLock key and TTL (if any) from the handler metadata.
     */
    const key: Optional<string> = this.reflector.get<Optional<string>>(
      DISTRIBUTED_LOCK_KEY,
      context.getHandler(),
    );
    const ttlSeconds: Optional<number> = this.reflector.get<number | undefined>(
      DISTRIBUTED_LOCK_TTL,
      context.getHandler(),
    );

    // No lock metadata: proceed as normal
    if (key == null || ttlSeconds == null) {
      return next.handle();
    }

    /**
     * Attempts to acquire the distributed lock for the specified key and TTL.
     * If acquisition fails, further processing is skipped (handler is not invoked).
     */
    const isAcquired: boolean = await this.lockService.acquire(key, ttlSeconds);
    if (!isAcquired) {
      return of(undefined);
    }

    /**
     * Lock acquired: process the request and ensure the lock is released
     * when the observable completes (either successfully or with error).
     */
    return next
      .handle()
      .pipe(finalize(() => void this.lockService.release(key)));
  }
}

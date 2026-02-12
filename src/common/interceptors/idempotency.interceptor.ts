/**
 * @fileoverview Interceptor for HTTP request idempotency.
 *
 * Uses "idempotency-key" header with a distributed Redis lock (SET NX PX) to
 * ensure true idempotency under concurrent requests. Duplicate requests with
 * the same key receive cached response without re-executing the handler.
 *
 * @interceptor idempotency
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Observable, of } from 'rxjs';
import { catchError, concatMap } from 'rxjs/operators';
import type { Nullable, Optional, Either } from '../types';

const RESPONSE_TTL_MS: number = 300_000; // 5 min
const LOCK_TTL_MS: number = 300_000; // 5 min (lock expires if handler hangs/crashes)
const POLL_INTERVAL_MS: number = 50;
const POLL_TIMEOUT_MS: number = 305_000; // Slightly longer than lock TTL

/**
 * Async sleep for polling without busy-waiting.
 *
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(
    (resolve: (value: Either<void, PromiseLike<void>>) => void) =>
      setTimeout(resolve, ms),
  );
}

/**
 * Interceptor that implements idempotency for HTTP requests based on the presence of an
 * "idempotency-key" header. Uses Redis SET NX PX as a distributed lock to prevent
 * concurrent requests with the same key from executing the handler simultaneously.
 *
 * Workflow:
 *   1. Checks for the presence of an "idempotency-key" header in the incoming request.
 *   2. If the key is missing, execution proceeds normally.
 *   3. If the key is present:
 *      - First checks if a cached response exists (responseKey). If yes, returns immediately.
 *      - Tries to acquire a distributed lock (lockKey) via SET NX PX.
 *      - If lock NOT acquired: another request is processing; poll until responseKey appears.
 *      - If lock acquired: execute handler, save response to responseKey, delete lockKey, emit.
 *
 * Responses are stored as JSON strings. Lock expires automatically on TTL if handler throws.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  /**
   * Creates an instance of the IdempotencyInterceptor.
   *
   * @param config - ConfigService for VALKEY_URL to connect to Redis.
   */
  constructor(
    private readonly config: ConfigService,
    @Inject('REDIS') private readonly redis: Redis,
  ) {}

  /**
   * Intercepts incoming HTTP requests, enforcing idempotency based on the "idempotency-key" header.
   *
   * @param context The current execution context.
   * @param next The next handler in the processing pipeline.
   * @returns An observable of the handler's response, potentially from cache.
   */
  public async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    // Retrieve the idempotency key from request headers, if provided.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const key: Optional<string> = request.headers?.['idempotency-key'];

    // If no idempotency key is present, process the request normally.
    if (key == null) {
      return next.handle();
    }

    const responseKey: string = `idempotency:response:${key}`;
    const lockKey: string = `idempotency:lock:${key}`;

    // 1. Check if cached response already exists
    const raw: Nullable<string> = await this.redis.get(responseKey);
    if (raw != null) {
      const body: unknown = JSON.parse(raw) as unknown;
      return of(body);
    }

    // 2. Try to acquire the distributed lock (SET key "1" NX PX ttl)
    const lockAcquired: Nullable<string> = await this.redis.set(
      lockKey,
      '1',
      'PX',
      LOCK_TTL_MS,
      'NX',
    );

    if (lockAcquired === null) {
      // 3. Lock NOT acquired — another request is processing; poll for response
      const body: unknown = await this.pollForResponse(responseKey);
      return of(body);
    }

    // 4. Lock acquired — execute handler, then save response and release lock before emitting
    return next.handle().pipe(
      concatMap(async (response: unknown) => {
        await this.redis.set(
          responseKey,
          JSON.stringify(response),
          'PX',
          RESPONSE_TTL_MS,
        );
        await this.redis.del(lockKey);
        return response;
      }),
      catchError(async (err: unknown) => {
        await this.redis.del(lockKey);
        throw err;
      }),
    );
  }

  /**
   * Polls Redis for the cached response until it appears or timeout.
   *
   * @param responseKey - Redis key for the cached response
   * @returns The parsed cached response
   * @throws ServiceUnavailableException if response does not appear within timeout
   */
  private async pollForResponse(responseKey: string): Promise<unknown> {
    const start: number = Date.now();

    while (Date.now() - start < POLL_TIMEOUT_MS) {
      const raw: Nullable<string> = await this.redis.get(responseKey);
      if (raw != null) {
        return JSON.parse(raw) as unknown;
      }
      await sleep(POLL_INTERVAL_MS);
    }

    throw new ServiceUnavailableException(
      'Idempotency: timed out waiting for concurrent request to complete',
    );
  }
}

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { Cache } from '@nestjs/cache-manager';
import type { Optional } from '../types';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  public async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const key: Optional<string> = request.headers?.['idempotency-key'];

    // sem header, segue normal
    if (key == null) {
      return next.handle();
    }

    const cacheKey: string = `idempotency:${key}`;

    const raw: unknown = await this.cache.get(cacheKey);

    if (raw != null) {
      // Normalize: cache may return string (e.g. Redis) or object (driver-dependent).
      // We always return the same type (object) so Nest serializes with consistent Content-Type.
      const body: unknown =
        typeof raw === 'string' ? JSON.parse(raw) : raw;
      return of(body);
    }

    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      tap(async (response: unknown) => {
        // Always store as string so read path can normalize consistently.
        await this.cache.set(
          cacheKey,
          JSON.stringify(response),
          300_000, // 5 min
        );
      }),
    );
  }
}

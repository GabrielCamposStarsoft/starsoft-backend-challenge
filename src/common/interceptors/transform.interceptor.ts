import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * TransformInterceptor applies a transformation to the response data before returning it.
 * By default, it returns the result unmodified, but the {@link transform} method can be
 * overridden in subclasses for custom behavior.
 *
 * @template T - The type of the incoming data handled by the interceptor.
 * @template R - The type of data after transformation.
 */
export class TransformInterceptor<
  T = unknown,
  R = T,
> implements NestInterceptor<T, R> {
  /**
   * Intercepts the request/response lifecycle and applies a transformation to the response data.
   *
   * @param _context - The current execution context (unused in base class).
   * @param next - The CallHandler for the next handler in the pipeline.
   * @returns An Observable emitting the transformed response data.
   */
  public intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<R> {
    return next.handle().pipe(
      map((data: T) => {
        // Transform the data before returning via the transform() hook.
        const transformed: R = this.transform(data);
        return transformed;
      }),
    );
  }

  /**
   * Transforms the response data.
   * Override this method in a subclass to implement custom transformation logic.
   *
   * @param data - The original response data.
   * @returns The transformed response data (default: returns the original value as is).
   */
  protected transform(data: T): R {
    return data as unknown as R;
  }
}

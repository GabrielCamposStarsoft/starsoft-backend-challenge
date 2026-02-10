import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

/**
 * TimeoutInterceptor enforces a time limit on requests/responses.
 * If the operation takes longer than the specified milliseconds,
 * an RXJS timeout error will be thrown.
 *
 * @template T - The type of the data handled by the interceptor.
 */
export class TimeoutInterceptor<T = unknown> implements NestInterceptor<T, T> {
  /**
   * @param ms - Timeout duration in milliseconds (default: 10000ms/10s)
   */
  constructor(private readonly ms: number = 10000) {}

  /**
   * Intercepts the request/response and applies a timeout to the observable chain.
   *
   * @param _context - The current execution context (unused).
   * @param next - The CallHandler for the next interceptor or controller.
   * @returns An Observable that throws if the timeout is exceeded.
   */
  public intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T> {
    return next.handle().pipe(timeout(this.ms));
  }
}

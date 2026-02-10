import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * LoggingInterceptor logs the response for each handled request,
 * including the context type (HTTP, RPC, or WS) in the log message.
 *
 * @template T - The type of the data handled by the interceptor.
 */
export class LoggingInterceptor<T = unknown> implements NestInterceptor<T, T> {
  /**
   * Logger instance for this interceptor.
   * @private
   */
  private readonly logger: Logger = new Logger(LoggingInterceptor.name);

  /**
   * Intercepts the request/response lifecycle to log the context type and response data.
   *
   * @param context - ExecutionContext providing details about the current request.
   * @param next - CallHandler for invoking the next interceptor or controller handler.
   * @returns An Observable that emits the response and logs the data.
   */
  public intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T> {
    // The communication type (HTTP, RPC, or WS); can further type as needed.
    const ctxType: string = context.getType<'http' | 'rpc' | 'ws'>();

    return next.handle().pipe(
      tap((data: T) => {
        this.logger.log(`[${ctxType.toUpperCase()}] Response:`, data);
      }),
    );
  }
}

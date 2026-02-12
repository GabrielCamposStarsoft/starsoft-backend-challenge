/**
 * @fileoverview Interceptor for execution lifecycle logging.
 *
 * Logs started, completed (with duration), and failed (with error and duration)
 * for handlers annotated with @LogExecution.
 *
 * @interceptor log-execution
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LOG_EXECUTION_LABEL } from '../constants';
import type { Optional } from '../types';
/**
 * Interceptor that logs the execution of methods annotated with @LogExecution.
 * Logs when execution starts, completes successfully (with duration), or fails (with error and duration).
 *
 * The interceptor uses reflection to retrieve an optional label (via LOG_EXECUTION_LABEL metadata).
 * If not provided, the log label defaults to `${ClassName}.${methodName}`.
 *
 * @see ../decorators/log-execution.decorator.ts
 */
@Injectable()
export class LogExecutionInterceptor implements NestInterceptor {
  /**
   * Creates a new instance of LogExecutionInterceptor.
   * @param reflector Used to read custom log execution metadata from the handler.
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * Intercepts a method call, logs its start, end (with duration), and error events.
   * @param context The current execution context.
   * @param next The next handler in the pipeline.
   * @returns Observable emitting the handler result.
   *
   * Logging format:
   *   - "[label] started" (before execution)
   *   - "[label] completed in Nms" (on success)
   *   - "[label] failed after Nms: error message" (on error)
   */
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    // Obtain an optional log label from metadata. Fallback to ClassName.methodName.
    const label: Optional<string> = this.reflector.get<Optional<string>>(
      LOG_EXECUTION_LABEL,
      context.getHandler(),
    );

    const className: string = context.getClass().name;
    const methodName: string = context.getHandler().name;
    const contextLabel: string =
      label != null && label !== '' ? label : `${className}.${methodName}`;

    const logger: Logger = new Logger(className);
    const start: number = Date.now();

    logger.debug(`[${contextLabel}] started`);

    return next.handle().pipe(
      tap({
        next: (): void => {
          const duration: number = Date.now() - start;
          logger.debug(`[${contextLabel}] completed in ${duration}ms`);
        },
        error: (err: unknown): void => {
          const duration: number = Date.now() - start;
          logger.warn(
            `[${contextLabel}] failed after ${duration}ms: ${err instanceof Error ? err.message : String(err)}`,
          );
        },
      }),
    );
  }
}

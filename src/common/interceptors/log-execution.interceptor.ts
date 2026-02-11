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

export const LOG_EXECUTION_LABEL = 'log_execution:label';

@Injectable()
export class LogExecutionInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const label = this.reflector.get<string | undefined>(
      LOG_EXECUTION_LABEL,
      context.getHandler(),
    );

    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const contextLabel =
      label != null && label !== '' ? label : `${className}.${methodName}`;

    const logger = new Logger(className);
    const start = Date.now();

    logger.debug(`[${contextLabel}] started`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          logger.debug(`[${contextLabel}] completed in ${duration}ms`);
        },
        error: (err: unknown) => {
          const duration = Date.now() - start;
          logger.warn(
            `[${contextLabel}] failed after ${duration}ms: ${err instanceof Error ? err.message : String(err)}`,
          );
        },
      }),
    );
  }
}

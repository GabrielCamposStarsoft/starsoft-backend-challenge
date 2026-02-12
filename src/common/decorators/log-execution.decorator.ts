/**
 * @fileoverview Decorator for structured method execution logging.
 *
 * Attaches LogExecutionInterceptor to log start, completion duration, and failures.
 * Useful for tracing long-running jobs and API handlers.
 *
 * @decorator log-execution
 */

import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { LOG_EXECUTION_LABEL } from '../constants';
import { LogExecutionInterceptor } from '../interceptors';
import type { Optional } from '../types';

/**
 * Logs method execution lifecycle (started, completed/failed, duration).
 *
 * @description Logs "started" before invocation, then "completed in Xms" or "failed after Xms".
 * Label improves traceability when multiple handlers share similar names.
 *
 * @param label - Optional string for log context; defaults to "ClassName.methodName"
 * @returns {MethodDecorator & ClassDecorator}
 *
 * @example
 * @LogExecution()
 * async handleJob() { await this.doWork(); }
 *
 * @LogExecution('reservation-expiration')
 * async handleExpiration() { await this.expireReservationsUseCase.execute(); }
 */
export const LogExecution = (
  label?: Optional<string>,
): MethodDecorator & ClassDecorator => {
  return applyDecorators(
    SetMetadata(LOG_EXECUTION_LABEL, label ?? undefined),
    UseInterceptors(LogExecutionInterceptor),
  );
};

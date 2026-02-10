import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { LogExecutionInterceptor } from '../interceptors/log-execution.interceptor';
import { LOG_EXECUTION_LABEL } from '../interceptors/log-execution.interceptor';

export { LOG_EXECUTION_LABEL } from '../interceptors/log-execution.interceptor';

/**
 * Decorator that logs method execution: logs "started" before the method runs
 * and "completed in Xms" or "failed after Xms" when it finishes.
 *
 * @param label - Optional label for the log (defaults to "ClassName.methodName")
 *
 * @example
 * ```ts
 * @LogExecution()
 * async handleJob() {
 *   await this.doWork();
 * }
 *
 * @LogExecution('reservation-expiration')
 * async handleExpiration() {
 *   await this.expireReservationsUseCase.execute();
 * }
 * ```
 */
export function LogExecution(label?: string): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(LOG_EXECUTION_LABEL, label ?? undefined),
    UseInterceptors(LogExecutionInterceptor),
  );
}

/**
 * @fileoverview Metadata key for log execution label.
 *
 * Used by @LogExecution decorator and LogExecutionInterceptor to store
 * an optional label for log identification (e.g. "CreateReservation").
 *
 * @module log-execution-label
 */

/**
 * Metadata key for optional log label.
 *
 * @description When set via @LogExecution('label'), logs include this
 * label for easier tracing in production.
 *
 * @constant
 */
export const LOG_EXECUTION_LABEL: string = 'log_execution:label';

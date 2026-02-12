/**
 * @fileoverview Standard HTTP error response shape.
 *
 * Returned by AllExceptionsFilter for all unhandled exceptions.
 *
 * @interface http-error-response
 */

import type { Either, Optional } from '../types';

/**
 * JSON structure for API error responses.
 */
export interface IHttpErrorResponse {
  /** HTTP status code (4xx or 5xx). */
  statusCode: number;

  /** ISO 8601 timestamp when the error occurred. */
  timestamp: string;

  /** Request URL path. */
  path: string;

  /** Human-readable message or array of validation errors. */
  message: Either<string, Array<string>>;

  /** Optional error type/category (e.g. "Bad Request"). */
  error?: Optional<string>;
}

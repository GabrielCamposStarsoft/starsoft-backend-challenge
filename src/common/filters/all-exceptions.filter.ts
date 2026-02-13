/**
 * @fileoverview Global exception filter for HTTP errors.
 *
 * This filter catches all unhandled exceptions and returns a consistent
 * JSON error response. It preserves status and message for HttpException-derived
 * errors, and falls back to HTTP 500 for unknown exceptions.
 *
 * @filter all-exceptions
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Either, Optional } from '../types';
import type { IHttpErrorResponse } from '../interfaces';
import type { HttpArgumentsHost } from '@nestjs/common/interfaces';

/**
 * Global exception filter that normalizes error responses.
 *
 * @template TException - Any exception extending Error or HttpException.
 * @implements ExceptionFilter
 */
@Catch()
export class AllExceptionsFilter<
  TException extends Either<Error, HttpException>,
> implements ExceptionFilter<TException> {
  /**
   * Handles and transforms any uncaught exception into an HTTP error response.
   *
   * @param {TException} exception - The thrown exception or error object.
   * @param {ArgumentsHost} host - The NestJS arguments host containing request context.
   * @returns {void}
   */
  public catch(exception: TException, host: ArgumentsHost): void {
    /** @type {'http'} */
    const contextType: 'http' = host.getType<'http'>();

    switch (contextType) {
      case 'http': {
        /**
         * HTTP context extraction.
         * @type {HttpArgumentsHost}
         */
        const ctx: HttpArgumentsHost = host.switchToHttp();
        /** @type {FastifyReply} */
        const response: FastifyReply = ctx.getResponse<FastifyReply>();
        /** @type {FastifyRequest} */
        const request: FastifyRequest = ctx.getRequest<FastifyRequest>();

        /**
         * Extract HTTP status code.
         * Use status from HttpException, default to 500 for others.
         * @type {number}
         */
        const status: number =
          exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        /**
         * Extract message; could be string or array of strings.
         * @type {Either<string, Array<string>>}
         */
        const message: Either<string, Array<string>> = exception instanceof
        HttpException
          ? this.extractHttpMessage(exception)
          : exception.message;

        /**
         * Shape outgoing error response object.
         * @type {IHttpErrorResponse}
         */
        const errorResponse: IHttpErrorResponse = {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message,
          error:
            exception instanceof HttpException
              ? ((exception.getResponse() as Record<string, unknown>)?.[
                  'error'
                ] as Optional<string>)
              : undefined,
        };

        response.status(status).send(errorResponse);
        break;
      }
    }
  }

  /**
   * Extracts the user-facing message from an HttpException.
   *
   * @param {HttpException} exception - Thrown HttpException instance.
   * @returns {Either<string, Array<string>>} String or array of validation messages.
   * @internal
   */
  private extractHttpMessage(
    exception: HttpException,
  ): Either<string, Array<string>> {
    /**
     * Response value can be a string or object with 'message' field.
     * @type {Either<string, object>}
     */
    const res: Either<string, object> = exception.getResponse();
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res !== null)
      return (
        ((res as Record<string, unknown>)?.['message'] as Either<
          string,
          Array<string>
        >) ?? exception.message
      );
    return exception.message;
  }
}

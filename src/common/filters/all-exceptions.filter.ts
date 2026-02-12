/**
 * @fileoverview Global exception filter for HTTP errors.
 *
 * Catches all unhandled exceptions and formats a consistent JSON error response
 * (statusCode, timestamp, path, message, error). HttpException status/message
 * are preserved; unknown errors return 500.
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
 * Catches all exceptions and returns a normalized HTTP error response.
 *
 * @description For HttpException, extracts status and message. For others,
 * uses 500 and exception message. Message can be string or string[].
 *
 * @template TException - Error or HttpException
 * @implements ExceptionFilter
 */
@Catch()
export class AllExceptionsFilter<
  TException extends Either<Error, HttpException>,
> implements ExceptionFilter<TException> {
  /**
   * Handles the exception and sends formatted error response.
   *
   * @param exception - The thrown error
   * @param host - Nest arguments host (HTTP context)
   */
  public catch(exception: TException, host: ArgumentsHost): void {
    const contextType: 'http' = host.getType<'http'>();

    switch (contextType) {
      case 'http': {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: FastifyReply = ctx.getResponse<FastifyReply>();
        const request: FastifyRequest = ctx.getRequest<FastifyRequest>();

        const status: number =
          exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message: Either<string, Array<string>> = exception instanceof
        HttpException
          ? this.extractHttpMessage(exception)
          : exception.message;

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
   * Extracts message from HttpException response.
   *
   * @param exception - HttpException instance
   * @returns String or array of validation messages
   * @internal
   */
  private extractHttpMessage(
    exception: HttpException,
  ): Either<string, Array<string>> {
    const res: Either<string, object> = exception.getResponse();
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res !== null)
      return (
        ((res as Record<string, unknown>)?.['message'] as string | string[]) ??
        exception.message
      );
    return exception.message;
  }
}

import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Catch, Logger } from '@nestjs/common';
import { EitherMultiple } from '../types';
import type { FastifyReply, FastifyRequest } from 'fastify'; // import do tipo correto

interface HttpErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error?: string;
}

/**
 * Filter that catches all exceptions and handles them appropriately.
 *
 * @template TException - The type of the exception to be caught.
 * @implements {ExceptionFilter<TException>}
 */
@Catch()
export class AllExceptionsFilter<
  TException extends EitherMultiple<[Error, HttpException]>,
> implements ExceptionFilter<TException> {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: TException, host: ArgumentsHost): void {
    const contextType: 'http' = host.getType<'http'>();

    switch (contextType) {
      case 'http': {
        const ctx = host.switchToHttp();
        const response: FastifyReply = ctx.getResponse<FastifyReply>(); // <-- aqui
        const request: FastifyRequest = ctx.getRequest<FastifyRequest>();

        const status: number =
          exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message: string | string[] =
          exception instanceof HttpException
            ? this.extractHttpMessage(exception)
            : exception.message;

        const errorResponse: HttpErrorResponse = {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message,
          error:
            exception instanceof HttpException
              ? ((exception.getResponse() as Record<string, unknown>)?.[
                  'error'
                ] as string | undefined)
              : undefined,
        };

        response.status(status).send(errorResponse);
        break;
      }
    }
  }

  private extractHttpMessage(exception: HttpException): string | string[] {
    const res = exception.getResponse();
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res !== null)
      return (
        ((res as Record<string, unknown>)?.['message'] as string | string[]) ??
        exception.message
      );
    return exception.message;
  }
}

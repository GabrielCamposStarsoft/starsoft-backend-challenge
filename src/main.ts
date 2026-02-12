/**
 * @fileoverview Application entry point and bootstrap logic.
 *
 * This file is the root executable of the Cinema Ticket API. It orchestrates:
 * - NestJS application creation with Fastify HTTP adapter
 * - Global exception handling and validation pipelines
 * - RabbitMQ microservice connection for async event processing
 * - API documentation (Scalar/Swagger) exposure at /api-docs
 *
 * The application runs as a hybrid: HTTP API for synchronous requests and
 * message consumer for domain events (reservation creation, payment confirmation).
 *
 * @entry main
 */

import { Logger, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { FastifyInstance } from 'fastify';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import {
  AllExceptionsFilter,
  RMQ_DLQ,
  RMQ_DLX,
  RMQ_QUEUE,
  type Either,
  type Optional,
} from 'src/common';
import { AppModule } from './app.module';

import type {
  FastifyBaseLogger,
  FastifyTypeProviderDefault,
  RawServerDefault,
} from 'fastify';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * @function bootstrap
 * @async
 * @description
 * Initializes and starts the NestJS application.
 *
 * - Configures global exception and validation filters.
 * - Sets up the connection to RabbitMQ with dead-letter exchange.
 * - Applies global validation pipes.
 * - Mounts OpenAPI/Scalar documentation at /api-docs.
 * - Starts all microservices and the HTTP server.
 *
 * @returns {Promise<void>} Resolves when startup is complete.
 * @throws Will exit process with code 1 if an unrecoverable error occurs during startup.
 */
const bootstrap = async (): Promise<void> => {
  /**
   * The INestApplication instance using Fastify adapter.
   * @type {INestApplication<FastifyInstance>}
   */
  const app: INestApplication<
    FastifyInstance<
      RawServerDefault,
      IncomingMessage,
      ServerResponse<IncomingMessage>,
      FastifyBaseLogger,
      FastifyTypeProviderDefault
    >
  > = await NestFactory.create<INestApplication<FastifyInstance>>(
    AppModule,
    new FastifyAdapter(),
  );

  /**
   * Applies global exception filters for i18n validation and all exceptions.
   */
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({ detailedErrors: false }),
    new AllExceptionsFilter(),
  );

  /**
   * RabbitMQ connection URL, from env or defaults to localhost.
   * @type {Optional<string>}
   */
  const rmqUrl: Optional<string> =
    process.env.RMQ_URL ?? 'amqp://guest:guest@localhost:5672';

  /**
   * Connects a RabbitMQ microservice for event processing, with dead-letter queue support.
   */
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: RMQ_QUEUE,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': RMQ_DLX,
          'x-dead-letter-routing-key': RMQ_DLQ,
        },
      },
      noAck: false,
    },
  });

  /**
   * Applies the global i18n validation pipe with strict settings.
   */
  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  /**
   * Swagger (OpenAPI) config object for API docs generation.
   * @type {Omit<OpenAPIObject, 'paths'>}
   */
  const config: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
    .setTitle('Cinema Ticket API')
    .setDescription('API for cinema ticket sales with concurrency control')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  /**
   * The OpenAPI document reflecting the API contract.
   * @type {OpenAPIObject}
   */
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);

  /**
   * Mounts Scalar API reference docs at /api-docs.
   */
  app.use(
    '/api-docs',
    apiReference({
      content: document,
      withFastify: true,
      theme: 'deepSpace',
    }),
  );

  /**
   * Starts all configured microservices (e.g., RabbitMQ).
   */
  await app.startAllMicroservices();

  /**
   * HTTP listen port. Defaults to 8088 if not provided in environment.
   * @type {number}
   */
  const port: number = parseInt(process.env.PORT ?? '8088');

  /**
   * Starts the HTTP server listening on all network interfaces.
   */
  await app.listen(port, '0.0.0.0');

  Logger.log(`HTTP server running on port ${String(port)}`, 'Bootstrap');
  Logger.log(`API docs (Scalar) at /api-docs`, 'Bootstrap');
  Logger.log(`RabbitMQ consumer connected to ${rmqUrl}`, 'Bootstrap');
};

/**
 * Application bootstrap entrypoint. Handles unhandled errors at top level.
 *
 * @function main
 */
bootstrap().catch((e: Either<Error, string>) => {
  /**
   * Logs and exits process if startup fails.
   * @param {Either<Error, string>} e - The error thrown at bootstrap.
   */
  const message = e instanceof Error ? e.message : e.toString();
  Logger.error(`Failed to start application: ${message}`, 'Bootstrap');
  process.exit(1);
});

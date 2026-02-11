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
import { AllExceptionsFilter, type Optional } from 'src/common';
import { AppModule } from './app.module';
import { RMQ_QUEUE, RMQ_DLX, RMQ_DLQ } from './common';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<INestApplication<FastifyInstance>>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({ detailedErrors: false }),
    new AllExceptionsFilter(),
  );
  const rmqUrl: Optional<string> =
    process.env.RMQ_URL ?? 'amqp://guest:guest@localhost:5672';

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

  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
    .setTitle('Cinema Ticket API')
    .setDescription(
      'API para venda de ingressos de cinema com controle de concorrência',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);

  app.use(
    '/api-docs',
    apiReference({
      content: document,
      withFastify: true,
      theme: 'deepSpace',
    }),
  );

  await app.startAllMicroservices();

  const port: number = parseInt(process.env.PORT ?? '8088');
  await app.listen(port, '0.0.0.0');

  Logger.log(`HTTP server running on port ${String(port)}`, 'Bootstrap');
  Logger.log(`API docs (Scalar) at /api-docs`, 'Bootstrap');
  Logger.log(`RabbitMQ consumer connected to ${rmqUrl}`, 'Bootstrap');
};

bootstrap().catch((e: Error | string) => {
  const message = e instanceof Error ? e.message : String(e);
  Logger.error(`Failed to start application: ${message}`, 'Bootstrap');
  process.exit(1);
});

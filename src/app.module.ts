/**
 * @fileoverview Root application module.
 *
 * Composes all feature modules, shared infrastructure (CommonModule, MessagingModule),
 * and cross-cutting concerns: database (TypeORM), cache (Keyv/Redis), i18n, throttling,
 * and scheduled jobs. Provides single APP_GUARD for throttler path skipping.
 *
 * @module app
 */

import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { typeOrmConnectionOptions } from '../database-options';
import { I18N_PATH, CommonModule, ThrottlerSkipPathsGuard } from 'src/common';
import { MessagingModule } from 'src/core';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { SalesModule } from './modules/sales/sales.module';
import { SeatsModule } from './modules/seats/seats.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';
@Module({
  imports: [
    CommonModule,
    AuthModule,
    ScheduleModule.forRoot({
      cronJobs: true,
      intervals: true,
      timeouts: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: [
          new KeyvRedis(process.env.VALKEY_URL ?? 'redis://localhost:6379'),
        ],
        ttl: 10_000,
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: I18N_PATH,
        watch: process.env.NODE_ENV !== 'production',
        includeSubfolders: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'l'] },
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    TypeOrmModule.forRoot({
      ...typeOrmConnectionOptions,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging:
        process.env.NODE_ENV !== 'production' &&
        process.env.DATABASE_LOGGING === 'true',
    }),
    MessagingModule,
    UsersModule,
    HealthModule,
    SessionsModule,
    SeatsModule,
    ReservationsModule,
    SalesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerSkipPathsGuard,
    },
  ],
})
/**
 * Root NestJS module aggregating all application modules and global configuration.
 *
 * @description Wires Auth, Health, Reservations, Sales, Seats, Sessions, and Users modules.
 * Schedules cron/intervals via ScheduleModule. Uses ThrottlerSkipPathsGuard to bypass
 * rate limiting on excluded paths (e.g. health checks, docs).
 */
export class AppModule {}

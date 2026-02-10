import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerSkipPathsGuard } from './common/guards/throttler-skip-paths.guard';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { DataSource } from 'typeorm';
import { getI18nPath } from './common';
import { CommonModule } from './common/common.module';
import { MessagingModule } from './core/messaging/messaging.module';
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
        path: getI18nPath(),
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
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT ?? '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize:
        process.env.NODE_ENV !== 'production' &&
        process.env.DATABASE_SYNC === 'true',
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
export class AppModule {
  constructor(private readonly dataSource: DataSource) {}
}

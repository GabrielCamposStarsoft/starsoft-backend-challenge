/**
 * @fileoverview Authentication module.
 *
 * Provides registration, login, refresh, logout, and JWT access/refresh flows.
 * Uses Passport JWT strategy and refresh token guard. Exports AuthService and JwtAuthGuard.
 *
 * @module auth
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { UserEntity } from '../users/entities';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers';
import { AuthService } from './services';
import { JwtStrategy } from './strategies';
import { JwtRefreshGuard } from './guards';
import { RefreshTokenEntity } from './entities';
import { AuthUseCases } from './use-cases';
import { AUTH_DEFAULTS, AUTH_ENV_KEYS } from './constants';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/common';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresInStr =
          configService.get<string>(
            AUTH_ENV_KEYS.JWT_ACCESS_EXPIRATION,
            AUTH_DEFAULTS.JWT_ACCESS_EXPIRATION,
          ) ?? AUTH_DEFAULTS.JWT_ACCESS_EXPIRATION;
        return {
          secret: configService.get<string>(AUTH_ENV_KEYS.JWT_SECRET),
          signOptions: { expiresIn: expiresInStr },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),
    UsersModule,
    RouterModule.register([{ path: 'auth', module: AuthModule }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ...AuthUseCases,
    JwtStrategy,
    JwtAuthGuard,
    JwtRefreshGuard,
  ],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}

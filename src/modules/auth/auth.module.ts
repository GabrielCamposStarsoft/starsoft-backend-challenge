import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { UserEntity } from '../users/entities';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RefreshTokenEntity } from './entities';
import { AuthUseCases } from './use-cases';
import {
  AUTH_ENV_KEYS,
  DEFAULT_JWT_ACCESS_EXPIRATION,
} from './constants/auth.constants';
import type { JwtModuleOptions } from '@nestjs/jwt';

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
            DEFAULT_JWT_ACCESS_EXPIRATION,
          ) ?? DEFAULT_JWT_ACCESS_EXPIRATION;
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
  providers: [AuthService, ...AuthUseCases, JwtStrategy, JwtAuthGuard, JwtRefreshGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}

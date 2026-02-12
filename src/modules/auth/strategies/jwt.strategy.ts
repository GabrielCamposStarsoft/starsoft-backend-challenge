/**
 * @fileoverview Passport JWT access token strategy.
 *
 * Validates Bearer token, loads user by sub claim, attaches IRequestUser to request.
 * Used by JwtAuthGuard. Rejects tokens with type !== 'access'.
 *
 * @strategy jwt-strategy
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, type StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { IJwtAccessPayload } from '../interfaces';
import { AuthService } from '../services/auth.service';
import { AUTH_ENV_KEYS } from '../constants';
import type { UserEntity } from '../../users/entities';
import type { Optional, IRequestUser, Nullable } from 'src/common';

/**
 * Validates JWT access tokens and resolves user for request.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * Configures strategy with JWT secret and Bearer extraction.
   *
   * @param configService - For JWT_SECRET
   * @param authService - For getUserById and getRequestUser
   * @param i18n - For error messages
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {
    const secret: Optional<string> = configService.get<string>(
      AUTH_ENV_KEYS.JWT_SECRET,
    );
    if (secret == null) {
      throw new Error('JWT_SECRET must be set for JwtStrategy');
    }
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };
    super(options);
  }

  /**
   * Called by Passport after token signature and expiry are validated.
   * Returns the user to attach to request.
   */
  public async validate(payload: IJwtAccessPayload): Promise<IRequestUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException(
        this.i18n.t('common.auth.invalidTokenType'),
      );
    }
    const user: Nullable<UserEntity> = await this.authService.getUserById(
      payload.sub,
    );
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('common.auth.userNoLongerExists'),
      );
    }
    return this.authService.getRequestUser(user);
  }
}

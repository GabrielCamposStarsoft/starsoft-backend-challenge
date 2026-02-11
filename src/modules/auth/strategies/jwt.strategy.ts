import { Injectable, UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { IJwtAccessPayload } from '../interfaces';
import type { IRequestUser } from '../interfaces';
import { AuthService } from '../services/auth.service';
import { AUTH_ENV_KEYS } from '../constants/auth.constants';
import type { UserEntity } from '../../users/entities/user.entity';
import { Optional } from 'src/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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
    const user: UserEntity | null = await this.authService.getUserById(
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

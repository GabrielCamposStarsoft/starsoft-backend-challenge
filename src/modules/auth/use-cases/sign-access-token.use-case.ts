import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { IUseCase } from 'src/common';
import { UserEntity } from '../../users/entities';
import type { IJwtAccessPayload } from '../interfaces';
import {
  AUTH_ENV_KEYS,
  DEFAULT_JWT_ACCESS_EXPIRATION,
} from '../constants/auth.constants';
import type { Nullable } from 'src/common';

export interface ISignAccessTokenOutput {
  accessToken: string;
  expiresIn: number;
}

@Injectable()
export class SignAccessTokenUseCase
  implements IUseCase<UserEntity, ISignAccessTokenOutput>
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async execute(user: UserEntity): Promise<ISignAccessTokenOutput> {
    const payload: IJwtAccessPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    const secret = this.getJwtSecret();
    const expiresInSeconds = this.getAccessExpirationSeconds();
    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresInSeconds,
    });
    return { accessToken, expiresIn: expiresInSeconds };
  }

  private getJwtSecret(): string {
    const secret = this.configService.get<string>(AUTH_ENV_KEYS.JWT_SECRET);
    if (secret === undefined) {
      throw new Error(
        'JWT_SECRET is not set. Set it in .env for authentication.',
      );
    }
    return secret;
  }

  private getAccessExpirationSeconds(): number {
    const expiresIn = this.configService.get<string>(
      AUTH_ENV_KEYS.JWT_ACCESS_EXPIRATION,
      DEFAULT_JWT_ACCESS_EXPIRATION,
    );
    const match: Nullable<RegExpMatchArray> =
      expiresIn?.match(/^(\d+)([smhd])$/) ?? null;
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * (multipliers[unit] ?? 60);
  }
}

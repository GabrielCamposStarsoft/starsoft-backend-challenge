import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import type { IUseCase } from 'src/common';
import type { Nullable } from 'src/common';
import { UserEntity } from '../../users/entities';
import { RefreshTokenEntity } from '../entities';
import {
  AUTH_ENV_KEYS,
  DEFAULT_JWT_REFRESH_EXPIRATION,
} from '../constants/auth.constants';
import { hashRefreshToken } from '../utils/hash-refresh-token.util';

@Injectable()
export class CreateRefreshTokenUseCase implements IUseCase<UserEntity, string> {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly configService: ConfigService,
  ) {}

  public async execute(user: UserEntity): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    const tokenHash = await hashRefreshToken(raw);
    const expiresIn = this.configService.get<string>(
      AUTH_ENV_KEYS.JWT_REFRESH_EXPIRATION,
      DEFAULT_JWT_REFRESH_EXPIRATION,
    );
    const expiresAt = this.parseExpirationToDate(expiresIn ?? '7d');

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      }),
    );
    return raw;
  }

  private parseExpirationToDate(expiresIn: string): Date {
    const match: Nullable<RegExpMatchArray> =
      expiresIn.match(/^(\d+)([smhd])$/) ?? null;
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const msPer: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * (msPer[unit] ?? 60000));
  }
}

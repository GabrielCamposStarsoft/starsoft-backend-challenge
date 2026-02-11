import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IUseCase } from 'src/common';
import type { Nullable } from 'src/common';
import { UserEntity } from '../../users/entities';
import { RefreshTokenEntity } from '../entities';
import { hashRefreshToken } from '../utils/hash-refresh-token.util';

@Injectable()
export class ValidateRefreshTokenUseCase implements IUseCase<
  string,
  UserEntity
> {
  private readonly logger = new Logger(ValidateRefreshTokenUseCase.name);

  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(refreshTokenValue: string): Promise<UserEntity> {
    const tokenHash = await hashRefreshToken(refreshTokenValue);
    const row: Nullable<RefreshTokenEntity> =
      await this.refreshTokenRepository.findOne({
        where: { tokenHash },
        relations: ['user'],
      });

    if (!row) {
      this.logger.warn(
        'Refresh failed: token not found or already invalidated',
      );
      throw new UnauthorizedException(
        this.i18n.t('common.auth.invalidOrExpiredToken'),
      );
    }

    if (row.expiresAt < new Date()) {
      await this.refreshTokenRepository.delete({ id: row.id });
      this.logger.warn(`Refresh failed: token expired (id=${row.id})`);
      throw new UnauthorizedException(
        this.i18n.t('common.auth.invalidOrExpiredToken'),
      );
    }

    return row.user;
  }
}

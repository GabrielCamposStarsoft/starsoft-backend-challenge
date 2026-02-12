/**
 * @fileoverview Use case for validating a refresh token.
 *
 * @use-case validate-refresh-token
 */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase, Nullable } from 'src/common';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities';
import { RefreshTokenEntity } from '../entities';
import { hashRefreshToken } from '../utils';

/**
 * @class ValidateRefreshTokenUseCase
 * @implements IUseCase<string, UserEntity>
 * @description
 * Use case responsible for validating a refresh token's existence and expiry,
 * and returning the associated user entity when valid.
 * Throws UnauthorizedException if the token is missing, expired, or invalid.
 */
@Injectable()
export class ValidateRefreshTokenUseCase implements IUseCase<
  string,
  UserEntity
> {
  /**
   * @property {Logger} logger
   * Logger instance for logging refresh token validation attempts.
   */
  private readonly logger: Logger = new Logger(
    ValidateRefreshTokenUseCase.name,
  );

  /**
   * @constructor
   * @param {Repository<RefreshTokenEntity>} refreshTokenRepository
   *   The repository used to access and modify refresh tokens.
   * @param {I18nService} i18n
   *   The internationalization service for localized exception messages.
   */
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Validates a refresh token:
   *  - Hashes the incoming token value
   *  - Looks up the refresh token entity by hash
   *  - Verifies the token is not expired
   *  - Deletes any expired tokens
   *  - Throws UnauthorizedException if invalid or expired
   *
   * @param {string} refreshTokenValue - The raw refresh token to validate.
   * @returns {Promise<UserEntity>} The user entity associated with the token if valid.
   * @throws {UnauthorizedException} If the token is missing, invalid, or expired.
   */
  public async execute(refreshTokenValue: string): Promise<UserEntity> {
    const tokenHash: string = await hashRefreshToken(refreshTokenValue);
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

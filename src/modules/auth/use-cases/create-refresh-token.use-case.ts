/**
 * @fileoverview Use case for creating a refresh token for a user.
 *
 * @use-case create-refresh-token
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import type { IUseCase, Nullable } from 'src/common';
import { Repository } from 'typeorm';
import { AUTH_DEFAULTS, AUTH_ENV_KEYS } from '../constants';
import { RefreshTokenEntity } from '../entities';
import { hashRefreshToken } from '../utils';
import type { ICreateRefreshTokenInput } from './interfaces';

/**
 * @class CreateRefreshTokenUseCase
 * @implements IUseCase<ICreateRefreshTokenInput, string>
 * @description
 * Use case for creating a refresh token for a user. Handles token generation, hashing,
 * setting expiration, and persisting the token to the database.
 */
@Injectable()
export class CreateRefreshTokenUseCase implements IUseCase<
  ICreateRefreshTokenInput,
  string
> {
  /**
   * @constructor
   * @param {Repository<RefreshTokenEntity>} refreshTokenRepository - Repository for managing RefreshToken entities.
   * @param {ConfigService} configService - Service for accessing app configuration values.
   */
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates and saves a new refresh token for a user.
   * @param {ICreateRefreshTokenInput} input - The input containing the userId for whom the refresh token is created.
   * @returns {Promise<string>} The raw (unhashed) refresh token value.
   */
  public async execute(input: ICreateRefreshTokenInput): Promise<string> {
    const raw: string = randomBytes(32).toString('hex');
    const tokenHash: string = await hashRefreshToken(raw);
    const expiresIn: string = this.configService.get<string>(
      AUTH_ENV_KEYS.JWT_REFRESH_EXPIRATION,
      AUTH_DEFAULTS.JWT_REFRESH_EXPIRATION,
    );
    const expiresAt: Date = this.parseExpirationToDate(
      expiresIn ?? AUTH_DEFAULTS.JWT_REFRESH_EXPIRATION,
    );

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: input.userId,
        tokenHash,
        expiresAt,
      }),
    );
    return raw;
  }

  /**
   * Parses an expiration interval string (like '7d', '12h') to a Date object in the future.
   * @param {string} expiresIn - The expiration interval string (e.g., '7d', '12h', '300s').
   * @returns {Date} The calculated future expiration date.
   * Defaults to 7 days if parsing fails.
   */
  private parseExpirationToDate(expiresIn: string): Date {
    const match: Nullable<RegExpMatchArray> =
      expiresIn.match(/^(\d+)([smhd])$/) ?? null;
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const value: number = parseInt(match[1], 10);
    const unit: string = match[2];
    const msPer: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * (msPer[unit] ?? 60000));
  }
}

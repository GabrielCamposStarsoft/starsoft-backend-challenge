/**
 * @fileoverview Use case for signing an access token for a user.
 *
 * @use-case sign-access-token
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { IUseCase, Nullable, Optional } from 'src/common';
import { AUTH_DEFAULTS, AUTH_ENV_KEYS } from '../constants';
import type { IJwtAccessPayload } from '../interfaces';
import type { ISignAccessTokenInput } from './interfaces';
import type { ISignAccessTokenResponse } from '../interfaces';

/**
 * @class SignAccessTokenUseCase
 * @implements IUseCase<ISignAccessTokenInput, ISignAccessTokenResponse>
 * @description
 * Use case class responsible for generating JWT access tokens for authenticated users,
 * including proper expiration handling and secret retrieval from configuration.
 */
@Injectable()
export class SignAccessTokenUseCase implements IUseCase<
  ISignAccessTokenInput,
  ISignAccessTokenResponse
> {
  /**
   * @constructor
   * @param {JwtService} jwtService - Service to sign the JWT payload.
   * @param {ConfigService} configService - Service to retrieve authentication configuration.
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates a JWT access token for a user.
   *
   * @param {ISignAccessTokenInput} input - The input data for signing the JWT access token.
   * @returns {ISignAccessTokenResponse} The access token and its expiration time (in seconds).
   */
  public execute(input: ISignAccessTokenInput): ISignAccessTokenResponse {
    const payload: IJwtAccessPayload = {
      sub: input.userId,
      email: input.email,
      role: input.role,
      type: 'access',
    };
    const secret: Optional<string> = this.getJwtSecret();
    const expiresInSeconds: number = this.getAccessExpirationSeconds();
    const accessToken: string = this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresInSeconds,
    });
    return { accessToken, expiresIn: expiresInSeconds };
  }

  /**
   * Retrieves the JWT secret from configuration.
   *
   * @private
   * @throws {Error} If the JWT secret is not set in configuration.
   * @returns {string} The JWT secret string.
   */
  private getJwtSecret(): string {
    const secret: Optional<string> = this.configService.get<string>(
      AUTH_ENV_KEYS.JWT_SECRET,
    );
    if (secret === undefined) {
      throw new Error(
        'JWT_SECRET is not set. Set it in .env for authentication.',
      );
    }
    return secret;
  }

  /**
   * Retrieves and parses the JWT access token expiration from configuration as seconds.
   * Supports formats such as '15m', '1h', or defaults to 900 seconds if parsing fails.
   *
   * @private
   * @returns {number} The expiration time in seconds.
   */
  private getAccessExpirationSeconds(): number {
    const expiresIn: string = this.configService.get<string>(
      AUTH_ENV_KEYS.JWT_ACCESS_EXPIRATION,
      AUTH_DEFAULTS.JWT_ACCESS_EXPIRATION,
    );
    const match: Nullable<RegExpMatchArray> =
      expiresIn?.match(/^(\d+)([smhd])$/) ?? null;
    if (!match) return 900;
    const value: number = parseInt(match[1], 10);
    const unit: string = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * (multipliers[unit] ?? 60);
  }
}

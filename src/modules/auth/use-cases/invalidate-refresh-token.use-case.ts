/**
 * @fileoverview Use case for invalidating (deleting) a refresh token by its raw value.
 *
 * @use-case invalidate-refresh-token
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IUseCase } from 'src/common';
import { DeleteResult, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../entities';
import { hashRefreshToken } from '../utils';
import type { IInvalidateRefreshTokenInput } from './interfaces';

/**
 * @class InvalidateRefreshTokenUseCase
 * @implements IUseCase<IInvalidateRefreshTokenInput, void>
 * @description
 * Use case for invalidating (deleting) a refresh token by its raw value.
 * Responsible for securely hashing the provided refresh token and removing the
 * corresponding record from the database.
 */
@Injectable()
export class InvalidateRefreshTokenUseCase implements IUseCase<
  IInvalidateRefreshTokenInput,
  void
> {
  /**
   * @property {Logger} logger - Logger instance for logging token invalidation events.
   */
  private readonly logger: Logger = new Logger(
    InvalidateRefreshTokenUseCase.name,
  );

  /**
   * @constructor
   * @param {Repository<RefreshTokenEntity>} refreshTokenRepository - The repository managing refresh tokens.
   */
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  /**
   * Invalidates the provided refresh token by hashing it and deleting the corresponding record.
   *
   * @param {IInvalidateRefreshTokenInput} input - The input containing the raw refresh token value to invalidate.
   * @returns {Promise<void>} - Resolves when the operation completes.
   */
  public async execute(input: IInvalidateRefreshTokenInput): Promise<void> {
    const tokenHash: string = await hashRefreshToken(input.refreshTokenValue);
    const result: DeleteResult = await this.refreshTokenRepository.delete({
      tokenHash,
    });
    if ((result.affected ?? 0) > 0) {
      this.logger.log('Refresh token invalidated (logout)');
    }
  }
}

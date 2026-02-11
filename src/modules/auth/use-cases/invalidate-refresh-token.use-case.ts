import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import type { IUseCase } from 'src/common';
import { RefreshTokenEntity } from '../entities';
import { hashRefreshToken } from '../utils/hash-refresh-token.util';

@Injectable()
export class InvalidateRefreshTokenUseCase implements IUseCase<string, void> {
  private readonly logger = new Logger(InvalidateRefreshTokenUseCase.name);

  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  public async execute(refreshTokenValue: string): Promise<void> {
    const tokenHash = await hashRefreshToken(refreshTokenValue);
    const result: DeleteResult = await this.refreshTokenRepository.delete({
      tokenHash,
    });
    if ((result.affected ?? 0) > 0) {
      this.logger.log('Refresh token invalidated (logout)');
    }
  }
}

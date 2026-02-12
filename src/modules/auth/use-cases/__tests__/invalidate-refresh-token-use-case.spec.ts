import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { DeleteResult, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../../entities';
import { InvalidateRefreshTokenUseCase } from '../invalidate-refresh-token.use-case';
import { hashRefreshToken } from '../../utils';

jest.mock('../../utils', () => ({
  hashRefreshToken: jest.fn(),
}));

describe('InvalidateRefreshTokenUseCase', () => {
  let useCase: InvalidateRefreshTokenUseCase;
  let refreshTokenRepository: jest.Mocked<
    Pick<Repository<RefreshTokenEntity>, 'delete'>
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvalidateRefreshTokenUseCase,
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: {
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(InvalidateRefreshTokenUseCase);
    refreshTokenRepository = module.get(getRepositoryToken(RefreshTokenEntity));

    jest.mocked(hashRefreshToken).mockResolvedValue('hashed-token');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should delete token by hash and complete without error', async () => {
      const deleteResult: DeleteResult = {
        raw: [],
        affected: 1,
      };
      refreshTokenRepository.delete.mockResolvedValue(deleteResult);

      await useCase.execute({ refreshTokenValue: 'raw-token' });

      expect(hashRefreshToken).toHaveBeenCalledWith('raw-token');
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        tokenHash: 'hashed-token',
      });
    });

    it('should complete when no row was affected (token already gone)', async () => {
      refreshTokenRepository.delete.mockResolvedValue({
        raw: [],
        affected: 0,
      });

      await expect(
        useCase.execute({ refreshTokenValue: 'unknown' }),
      ).resolves.toBeUndefined();

      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        tokenHash: 'hashed-token',
      });
    });
  });
});

import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { RefreshTokenEntity } from '../../entities';
import { CreateRefreshTokenUseCase } from '../create-refresh-token.use-case';
import { hashRefreshToken } from '../../utils';

jest.mock('../../utils', () => ({
  hashRefreshToken: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: (): string => 'raw-token-hex-64-chars',
  })),
}));

describe('CreateRefreshTokenUseCase', () => {
  let useCase: CreateRefreshTokenUseCase;
  let refreshTokenRepository: jest.Mocked<
    Pick<Repository<RefreshTokenEntity>, 'save' | 'create'>
  >;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRefreshTokenUseCase,
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: {
            create: jest.fn((dto: Partial<RefreshTokenEntity>) => dto),
            save: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('7d'),
          },
        },
      ],
    }).compile();

    useCase = module.get(CreateRefreshTokenUseCase);
    refreshTokenRepository = module.get(getRepositoryToken(RefreshTokenEntity));
    configService = module.get(ConfigService);

    jest.mocked(hashRefreshToken).mockResolvedValue('hashed-token-value');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create refresh token and return raw value', async () => {
      const result = await useCase.execute({ userId: 'user-uuid' });

      expect(result).toBe('raw-token-hex-64-chars');
      expect(hashRefreshToken).toHaveBeenCalledWith('raw-token-hex-64-chars');
      expect(configService.get).toHaveBeenCalledWith(
        'JWT_REFRESH_EXPIRATION',
        expect.any(String),
      );
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid',
          tokenHash: 'hashed-token-value',
        }),
      );
      expect(refreshTokenRepository.save).toHaveBeenCalled();
    });

    it('should pass correct expiresAt when expiration is 1d', async () => {
      configService.get.mockReturnValue('1d');

      await useCase.execute({ userId: 'user-uuid' });

      const created = jest.mocked(refreshTokenRepository.create).mock
        .calls[0][0] as { expiresAt: Date };
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      expect(created.expiresAt.getTime()).toBeGreaterThanOrEqual(now);
      expect(created.expiresAt.getTime()).toBeLessThanOrEqual(
        now + dayMs + 1000,
      );
    });
  });
});

import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { UserEntity } from '../../../users/entities';
import { RefreshTokenEntity } from '../../entities';
import { ValidateRefreshTokenUseCase } from '../validate-refresh-token.use-case';
import { hashRefreshToken } from '../../utils';

jest.mock('../../utils', () => ({
  hashRefreshToken: jest.fn(),
}));

describe('ValidateRefreshTokenUseCase', () => {
  let useCase: ValidateRefreshTokenUseCase;
  let refreshTokenRepository: jest.Mocked<
    Pick<Repository<RefreshTokenEntity>, 'findOne' | 'delete'>
  >;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockUser: UserEntity = {
    id: 'user-uuid',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'hashed',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserEntity;

  const futureDate = new Date(Date.now() + 86400000);
  const pastDate = new Date(Date.now() - 86400000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateRefreshTokenUseCase,
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: {
            findOne: jest.fn(),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockReturnValue('Invalid or expired token'),
          },
        },
      ],
    }).compile();

    useCase = module.get(ValidateRefreshTokenUseCase);
    refreshTokenRepository = module.get(getRepositoryToken(RefreshTokenEntity));
    i18nService = module.get(I18nService);

    jest.mocked(hashRefreshToken).mockResolvedValue('hashed-token');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return user when token is valid and not expired', async () => {
      const row: RefreshTokenEntity = {
        id: 'token-id',
        userId: mockUser.id,
        tokenHash: 'hashed-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        user: mockUser,
      } as RefreshTokenEntity;

      refreshTokenRepository.findOne.mockResolvedValue(row);

      const result = await useCase.execute('raw-refresh-token');

      expect(result).toBe(mockUser);
      expect(hashRefreshToken).toHaveBeenCalledWith('raw-refresh-token');
      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { tokenHash: 'hashed-token' },
        relations: ['user'],
      });
      expect(refreshTokenRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is not found', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'common.auth.invalidOrExpiredToken',
      );
      expect(refreshTokenRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException and delete token when expired', async () => {
      const row: RefreshTokenEntity = {
        id: 'expired-token-id',
        userId: mockUser.id,
        tokenHash: 'hashed-token',
        expiresAt: pastDate,
        createdAt: new Date(),
        user: mockUser,
      } as RefreshTokenEntity;

      refreshTokenRepository.findOne.mockResolvedValue(row);

      await expect(useCase.execute('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        id: 'expired-token-id',
      });
      expect(i18nService.t).toHaveBeenCalledWith(
        'common.auth.invalidOrExpiredToken',
      );
    });
  });
});

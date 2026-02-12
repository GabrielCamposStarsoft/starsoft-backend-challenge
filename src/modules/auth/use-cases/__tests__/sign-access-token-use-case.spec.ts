import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/common';
import { SignAccessTokenUseCase } from '../sign-access-token.use-case';

describe('SignAccessTokenUseCase', () => {
  let useCase: SignAccessTokenUseCase;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignAccessTokenUseCase,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-access-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(SignAccessTokenUseCase);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  beforeEach(() => {
    configService.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_ACCESS_EXPIRATION') return defaultValue ?? '15m';
        return defaultValue;
      },
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return accessToken and expiresIn when config is valid', () => {
      const result = useCase.execute({
        userId: 'user-uuid',
        email: 'user@example.com',
        role: UserRole.USER,
      });

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        expiresIn: 900,
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'user-uuid',
          email: 'user@example.com',
          role: UserRole.USER,
          type: 'access',
        },
        {
          secret: 'test-secret',
          expiresIn: 900,
        },
      );
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(configService.get).toHaveBeenCalledWith(
        'JWT_ACCESS_EXPIRATION',
        expect.any(String),
      );
    });

    it('should parse 1h expiration as 3600 seconds', () => {
      configService.get.mockImplementation(
        (key: string, defaultValue?: string) => {
          if (key === 'JWT_SECRET') return 'secret';
          if (key === 'JWT_ACCESS_EXPIRATION') return '1h';
          return defaultValue;
        },
      );

      const result = useCase.execute({
        userId: 'id',
        email: 'e@e.com',
        role: UserRole.USER,
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: 3600 }),
      );
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw when JWT_SECRET is not set', () => {
      configService.get.mockReturnValue(undefined);

      expect(() =>
        useCase.execute({
          userId: 'id',
          email: 'e@e.com',
          role: UserRole.USER,
        }),
      ).toThrow('JWT_SECRET is not set');
    });
  });
});

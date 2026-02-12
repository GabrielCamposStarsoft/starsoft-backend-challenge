import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import * as argon2 from 'argon2';
import type { UserEntity } from '../../../users/entities';
import { UsersService } from '../../../users/services/users.service';
import { ValidateUserUseCase } from '../validate-user.use-case';

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

describe('ValidateUserUseCase', () => {
  let useCase: ValidateUserUseCase;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail'>>;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockUser: UserEntity = {
    id: 'user-uuid',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateUserUseCase,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockReturnValue('Invalid credentials'),
          },
        },
      ],
    }).compile();

    useCase = module.get(ValidateUserUseCase);
    usersService = module.get(UsersService);
    i18nService = module.get(I18nService);
    jest.mocked(argon2.verify).mockReset();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return user when email exists and password is valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.mocked(argon2.verify).mockResolvedValue(true);

      const result = await useCase.execute({
        email: 'john@example.com',
        password: 'plainPassword',
      });

      expect(result).toBe(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(argon2.verify).toHaveBeenCalledWith(
        'hashedPassword',
        'plainPassword',
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        useCase.execute({
          email: 'unknown@example.com',
          password: 'any',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'unknown@example.com',
      );
      expect(argon2.verify).not.toHaveBeenCalled();
      expect(i18nService.t).toHaveBeenCalledWith(
        'common.auth.invalidCredentials',
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.mocked(argon2.verify).mockResolvedValue(false);

      await expect(
        useCase.execute({
          email: 'john@example.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(argon2.verify).toHaveBeenCalledWith(
        'hashedPassword',
        'wrongPassword',
      );
      expect(i18nService.t).toHaveBeenCalledWith(
        'common.auth.invalidCredentials',
      );
    });
  });
});

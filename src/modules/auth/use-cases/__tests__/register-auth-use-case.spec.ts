import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import type { UserEntity } from '../../../users/entities';
import { UserRole } from 'src/common';
import { UsersService } from '../../../users/services/users.service';
import { RegisterAuthUseCase } from '../register-auth.use-case';

describe('RegisterAuthUseCase', () => {
  let useCase: RegisterAuthUseCase;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'create'>>;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockResponse = {
    id: 'user-uuid',
    username: 'john',
    email: 'john@example.com',
    role: UserRole.USER,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterAuthUseCase,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    useCase = module.get(RegisterAuthUseCase);
    usersService = module.get(UsersService);
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should register user and return response DTO when email is available', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        ...mockResponse,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({
        email: 'john@example.com',
        password: 'Password1!',
      });

      expect(result).toEqual({
        ...mockResponse,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        createdAt: expect.any(Date),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        updatedAt: expect.any(Date),
      });

      expect(usersService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'john@example.com',
        username: 'john',
        password: 'Password1!',
      });
      expect(i18nService.t).not.toHaveBeenCalledWith(
        'common.user.emailExists',
        expect.anything(),
      );
    });

    it('should use email prefix as username when email has no @', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        ...mockResponse,
        createdAt: new Date(),
        updatedAt: new Date(),
        email: 'nobody',
        username: 'nobody',
      });

      await useCase.execute({
        email: 'nobody',
        password: 'Password1!',
      });

      expect(usersService.create).toHaveBeenCalledWith({
        email: 'nobody',
        username: 'nobody',
        password: 'Password1!',
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const existingUser = { id: 'existing-id' } as UserEntity;
      usersService.findByEmail.mockResolvedValue(existingUser);
      i18nService.t.mockReturnValue('Email already exists');

      await expect(
        useCase.execute({
          email: 'existing@example.com',
          password: 'Password1!',
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
      expect(usersService.create).not.toHaveBeenCalled();
      expect(i18nService.t).toHaveBeenCalledWith('common.user.emailExists', {
        args: { email: 'existing@example.com' },
      });
    });
  });
});

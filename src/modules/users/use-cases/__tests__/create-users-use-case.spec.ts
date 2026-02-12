import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import * as argon2 from 'argon2';
import type { Repository } from 'typeorm';
import { UserRole } from 'src/common';
import { UserEntity } from '../../entities';
import { CreateUsersUseCase } from '../create-users.use-case';

jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

describe('CreateUsersUseCase', () => {
  let useCase: CreateUsersUseCase;
  let usersRepository: jest.Mocked<
    Pick<Repository<UserEntity>, 'findOne' | 'create' | 'save'>
  >;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockUserEntity: UserEntity = {
    id: 'user-uuid',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserEntity;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUsersUseCase,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    useCase = module.get(CreateUsersUseCase);
    usersRepository = module.get(getRepositoryToken(UserEntity));
    i18nService = module.get(I18nService);
    jest.mocked(argon2.hash).mockReset();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create user with hashed password when email is available', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue(null);
      jest.mocked(argon2.hash).mockResolvedValue('hashedPassword' as never);
      usersRepository.create.mockImplementation(
        (data) =>
          ({
            ...mockUserEntity,
            ...data,
          }) as UserEntity,
      );
      usersRepository.save.mockResolvedValue(mockUserEntity);

      const input = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'plainPassword',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toEqual(mockUserEntity);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(argon2.hash).toHaveBeenCalledWith('plainPassword');
      expect(usersRepository.create).toHaveBeenCalledWith({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'hashedPassword',
      });
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create user with optional role when provided', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue(null);
      jest.mocked(argon2.hash).mockResolvedValue('hashedPassword' as never);
      const userWithRole = { ...mockUserEntity, role: UserRole.ADMIN };
      usersRepository.create.mockImplementation(
        (data) =>
          ({
            ...userWithRole,
            ...data,
          }) as UserEntity,
      );
      usersRepository.save.mockResolvedValue(userWithRole);

      const input = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'AdminPass1!',
        role: UserRole.ADMIN,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.role).toBe(UserRole.ADMIN);
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.ADMIN,
        }),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const existingUser = { id: 'existing-id', email: 'john@example.com' };
      usersRepository.findOne.mockResolvedValue(
        existingUser as unknown as UserEntity,
      );
      i18nService.t.mockReturnValue('Email already exists');

      const input = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'plainPassword',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(argon2.hash).not.toHaveBeenCalled();
      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });
});

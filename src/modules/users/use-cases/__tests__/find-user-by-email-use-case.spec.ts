import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserEntity } from '../../entities';
import { FindUserByEmailUseCase } from '../find-user-by-email.use-case';

describe('FindUserByEmailUseCase', () => {
  let useCase: FindUserByEmailUseCase;
  let usersRepository: jest.Mocked<Pick<Repository<UserEntity>, 'findOne'>>;

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
    const mockRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUserByEmailUseCase,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get(FindUserByEmailUseCase);
    usersRepository = module.get(getRepositoryToken(UserEntity));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return user when found by email', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute({
        email: 'john@example.com',
      });

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return null when user is not found', async () => {
      // Arrange
      usersRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({
        email: 'unknown@example.com',
      });

      // Assert
      expect(result).toBeNull();
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'unknown@example.com' },
      });
    });
  });
});

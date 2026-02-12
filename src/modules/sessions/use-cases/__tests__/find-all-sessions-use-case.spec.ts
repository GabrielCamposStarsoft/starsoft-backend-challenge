import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { SessionEntity } from '../../entities';
import { FindAllSessionsUseCase } from '../find-all-sessions.use-case';

describe('FindAllSessionsUseCase', () => {
  let useCase: FindAllSessionsUseCase;
  let sessionsRepository: jest.Mocked<
    Pick<Repository<SessionEntity>, 'find' | 'count'>
  >;

  const mockSessions: SessionEntity[] = [
    {
      id: 'session-1',
      movieTitle: 'Movie 1',
      roomName: 'Room 1',
      startTime: new Date(),
      endTime: new Date(),
      ticketPrice: 25,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SessionEntity,
  ];

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllSessionsUseCase,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get(FindAllSessionsUseCase);
    sessionsRepository = module.get(getRepositoryToken(SessionEntity));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return sessions and total count with pagination', async () => {
      // Arrange
      sessionsRepository.find.mockResolvedValue(mockSessions);
      sessionsRepository.count.mockResolvedValue(1);

      const input = { page: 1, limit: 10 };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toEqual([mockSessions, 1]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
      expect(sessionsRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should calculate correct skip for page 2', async () => {
      // Arrange
      sessionsRepository.find.mockResolvedValue([]);
      sessionsRepository.count.mockResolvedValue(0);

      const input = { page: 2, limit: 10 };

      // Act
      await useCase.execute(input);

      // Assert
      expect(sessionsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });
});

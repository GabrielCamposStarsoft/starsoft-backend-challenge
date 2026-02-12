import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { SessionEntity } from '../../entities';
import { CreateSessionsUseCase } from '../create-sessions.use-case';

describe('CreateSessionsUseCase', () => {
  let useCase: CreateSessionsUseCase;
  let sessionsRepository: jest.Mocked<
    Pick<Repository<SessionEntity>, 'create' | 'save'>
  >;

  const mockSession: SessionEntity = {
    id: 'session-uuid',
    movieTitle: 'Inception',
    roomName: 'Room 1',
    startTime: new Date('2025-03-01T19:00:00Z'),
    endTime: new Date('2025-03-01T21:00:00Z'),
    ticketPrice: 25.5,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SessionEntity;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSessionsUseCase,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get(CreateSessionsUseCase);
    sessionsRepository = module.get(getRepositoryToken(SessionEntity));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create and save a session with correct input mapping', async () => {
      // Arrange
      const createdSession = { ...mockSession };
      sessionsRepository.create.mockReturnValue(createdSession);
      sessionsRepository.save.mockResolvedValue(mockSession);

      const input = {
        movieTitle: 'Inception',
        roomName: 'Room 1',
        startTime: '2025-03-01T19:00:00Z',
        endTime: '2025-03-01T21:00:00Z',
        ticketPrice: 25.5,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toEqual(mockSession);
      expect(sessionsRepository.create).toHaveBeenCalledWith({
        movieTitle: 'Inception',
        roomName: 'Room 1',
        startTime: new Date('2025-03-01T19:00:00Z'),
        endTime: new Date('2025-03-01T21:00:00Z'),
        ticketPrice: 25.5,
      });
      expect(sessionsRepository.save).toHaveBeenCalledWith(createdSession);
      expect(sessionsRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});

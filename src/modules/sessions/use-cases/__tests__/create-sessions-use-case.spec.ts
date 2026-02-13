import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { Repository } from 'typeorm';
import { SessionEntity } from '../../entities';
import { CreateSessionsUseCase } from '../create-sessions.use-case';

describe('CreateSessionsUseCase', () => {
  let useCase: CreateSessionsUseCase;
  let sessionsRepository: jest.Mocked<
    Pick<Repository<SessionEntity>, 'create' | 'save' | 'find'>
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
      find: jest.fn().mockResolvedValue([]),
    };

    const mockI18n = {
      t: jest.fn().mockReturnValue('Room schedule conflict'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSessionsUseCase,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: mockRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
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
        startTime: new Date('2025-03-01T19:00:00Z'),
        endTime: new Date('2025-03-01T21:00:00Z'),
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

    it('should throw ConflictException when room has overlapping session', async () => {
      const existingSession = {
        ...mockSession,
        id: 'other-session',
        startTime: new Date('2025-03-01T18:00:00Z'),
        endTime: new Date('2025-03-01T20:00:00Z'),
      } as SessionEntity;
      sessionsRepository.find.mockResolvedValue([existingSession]);
      sessionsRepository.create.mockReturnValue(mockSession);

      const input = {
        movieTitle: 'New Movie',
        roomName: 'Room 1',
        startTime: new Date('2025-03-01T19:30:00Z'),
        endTime: new Date('2025-03-01T22:00:00Z'),
        ticketPrice: 30,
      };

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: { roomName: 'Room 1' },
      });
      expect(sessionsRepository.save).not.toHaveBeenCalled();
    });
  });
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { QueryFailedError, type Repository } from 'typeorm';
import { SessionEntity } from '../../entities';
import { overlaps, UpdateSessionUseCase } from '../update-sessions.use-case';

describe('overlaps', () => {
  it('should return true when intervals overlap', () => {
    const start = new Date('2025-01-01T10:00:00Z');
    const end = new Date('2025-01-01T12:00:00Z');
    const otherStart = new Date('2025-01-01T11:00:00Z');
    const otherEnd = new Date('2025-01-01T13:00:00Z');
    expect(overlaps(start, end, otherStart, otherEnd)).toBe(true);
  });

  it('should return false when intervals do not overlap', () => {
    const start = new Date('2025-01-01T10:00:00Z');
    const end = new Date('2025-01-01T12:00:00Z');
    const otherStart = new Date('2025-01-01T12:00:00Z');
    const otherEnd = new Date('2025-01-01T14:00:00Z');
    expect(overlaps(start, end, otherStart, otherEnd)).toBe(false);
  });

  it('should return false when second interval ends before first begins', () => {
    const start = new Date('2025-01-01T12:00:00Z');
    const end = new Date('2025-01-01T14:00:00Z');
    const otherStart = new Date('2025-01-01T08:00:00Z');
    const otherEnd = new Date('2025-01-01T10:00:00Z');
    expect(overlaps(start, end, otherStart, otherEnd)).toBe(false);
  });
});

describe('UpdateSessionUseCase', () => {
  let useCase: UpdateSessionUseCase;
  let sessionRepository: jest.Mocked<
    Pick<Repository<SessionEntity>, 'findOne' | 'find' | 'update'>
  >;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockSession: SessionEntity = {
    id: 'session-1',
    movieTitle: 'Inception',
    roomName: 'Room 1',
    startTime: new Date('2025-01-01T10:00:00Z'),
    endTime: new Date('2025-01-01T12:00:00Z'),
    ticketPrice: 25.5,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SessionEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSessionUseCase,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({}),
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

    useCase = module.get(UpdateSessionUseCase);
    sessionRepository = module.get(getRepositoryToken(SessionEntity));
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update session when there are no conflicts', async () => {
      // Arrange
      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.find.mockResolvedValue([]);

      const input = {
        id: 'session-1',
        movieTitle: 'Interstellar',
        ticketPrice: 30,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(sessionRepository.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({ movieTitle: 'Interstellar', ticketPrice: 30 }),
      );
    });

    it('should throw NotFoundException when session does not exist', async () => {
      // Arrange
      sessionRepository.findOne.mockResolvedValue(null);
      i18nService.t.mockReturnValue('Session not found');

      const input = { id: 'non-existent', movieTitle: 'Interstellar' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
      expect(sessionRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when startTime >= endTime', async () => {
      // Arrange
      sessionRepository.findOne.mockResolvedValue(mockSession);

      const input = {
        id: 'session-1',
        startTime: '2025-01-01T12:00:00Z',
        endTime: '2025-01-01T10:00:00Z',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
      expect(sessionRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when another session in the same room overlaps', async () => {
      // Arrange
      sessionRepository.findOne.mockResolvedValue(mockSession);
      const conflictingSession: SessionEntity = {
        id: 'session-2',
        roomName: 'Room 1',
        startTime: new Date('2025-01-01T11:00:00Z'),
        endTime: new Date('2025-01-01T13:00:00Z'),
      } as SessionEntity;
      sessionRepository.find.mockResolvedValue([conflictingSession]);
      i18nService.t.mockReturnValue('Room schedule conflict');

      const input = {
        id: 'session-1',
        roomName: 'Room 1',
        startTime: '2025-01-01T10:00:00Z',
        endTime: '2025-01-01T12:00:00Z',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
      expect(sessionRepository.update).not.toHaveBeenCalled();
    });

    it('should not update when no fields are provided', async () => {
      // Arrange
      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.find.mockResolvedValue([]);

      const input = { id: 'session-1' };

      // Act
      await useCase.execute(input);

      // Assert
      expect(sessionRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when DB raises exclusion constraint violation', async () => {
      // Arrange
      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.find.mockResolvedValue([]);
      i18nService.t.mockReturnValue('Room schedule conflict');

      const pgError = { code: '23P01' };
      const queryFailedError = Object.create(QueryFailedError.prototype) as QueryFailedError;
      Object.defineProperty(queryFailedError, 'driverError', { value: pgError });
      sessionRepository.update.mockRejectedValue(queryFailedError);

      const input = {
        id: 'session-1',
        startTime: '2025-01-01T10:00:00Z',
        endTime: '2025-01-01T12:00:00Z',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    });

    it('should rethrow non-exclusion DB errors', async () => {
      // Arrange
      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.find.mockResolvedValue([]);
      const genericError = new Error('DB connection error');
      sessionRepository.update.mockRejectedValue(genericError);

      const input = {
        id: 'session-1',
        movieTitle: 'Interstellar',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('DB connection error');
    });

    it('should not check overlap against the session being updated', async () => {
      // Arrange
      sessionRepository.findOne.mockResolvedValue(mockSession);
      // The same session is returned as an "other" — it should be excluded from conflict check
      sessionRepository.find.mockResolvedValue([mockSession]);

      const input = {
        id: 'session-1',
        startTime: '2025-01-01T10:00:00Z',
        endTime: '2025-01-01T12:00:00Z',
      };

      // Act — should not throw because s.id === id is excluded
      await useCase.execute(input);

      // Assert
      expect(sessionRepository.update).toHaveBeenCalled();
    });
  });
});

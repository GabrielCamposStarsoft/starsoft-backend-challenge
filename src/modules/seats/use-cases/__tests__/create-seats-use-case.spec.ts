import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { Repository } from 'typeorm';
import { SeatEntity } from '../../entities';
import { SessionEntity } from '../../../sessions/entities';
import { CreateSeatsUseCase } from '../create-seats.use-case';

describe('CreateSeatsUseCase', () => {
  let useCase: CreateSeatsUseCase;
  let seatsRepository: jest.Mocked<
    Pick<Repository<SeatEntity>, 'create' | 'save'>
  >;
  let sessionsRepository: jest.Mocked<
    Pick<Repository<SessionEntity>, 'findOne'>
  >;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockSession = {
    id: 'session-1',
    movieTitle: 'Movie 1',
    roomName: 'Room 1',
  } as SessionEntity;

  const mockSeat: SeatEntity = {
    id: 'seat-1',
    sessionId: 'session-1',
    label: 'A1',
    status: 'available',
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SeatEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSeatsUseCase,
        {
          provide: getRepositoryToken(SeatEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: {
            findOne: jest.fn(),
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

    useCase = module.get(CreateSeatsUseCase);
    seatsRepository = module.get(getRepositoryToken(SeatEntity));
    sessionsRepository = module.get(getRepositoryToken(SessionEntity));
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create seat when session exists', async () => {
      // Arrange
      sessionsRepository.findOne.mockResolvedValue(mockSession);
      seatsRepository.create.mockImplementation(
        (data) =>
          ({
            ...mockSeat,
            ...data,
          }) as SeatEntity,
      );
      seatsRepository.save.mockResolvedValue(mockSeat);

      const input = { label: 'A1', sessionId: 'session-1' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toEqual(mockSeat);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
      expect(seatsRepository.create).toHaveBeenCalledWith({
        label: 'A1',
        sessionId: 'session-1',
      });
      expect(seatsRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when session does not exist', async () => {
      // Arrange
      sessionsRepository.findOne.mockResolvedValue(null);
      i18nService.t.mockReturnValue('Session not found');

      const input = { label: 'A1', sessionId: 'non-existent' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(seatsRepository.create).not.toHaveBeenCalled();
      expect(seatsRepository.save).not.toHaveBeenCalled();
    });
  });
});

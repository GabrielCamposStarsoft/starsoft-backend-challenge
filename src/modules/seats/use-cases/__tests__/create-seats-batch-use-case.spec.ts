import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { SessionEntity } from 'src/modules/sessions/entities';
import { SessionStatus } from 'src/modules/sessions/enums';
import { DataSource } from 'typeorm';
import { SeatEntity } from '../../entities';
import { CreateSeatsBatchUseCase } from '../create-seats-batch.use-case';

describe('CreateSeatsBatchUseCase', () => {
  let useCase: CreateSeatsBatchUseCase;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockSession = {
    id: 'session-1',
    status: SessionStatus.ACTIVE,
    movieTitle: 'Inception',
    roomName: 'Room 1',
  } as SessionEntity;

  const mockSeats: SeatEntity[] = [
    { id: 'seat-1', sessionId: 'session-1', label: 'A1' } as SeatEntity,
    { id: 'seat-2', sessionId: 'session-1', label: 'A2' } as SeatEntity,
  ];

  let mockManager: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn().mockResolvedValue(mockSession),
      create: jest
        .fn()
        .mockImplementation(
          (_entity: unknown, data: Partial<SeatEntity>) =>
            ({ ...data }) as SeatEntity,
        ),
      save: jest.fn().mockResolvedValue(mockSeats),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSeatsBatchUseCase,
        {
          provide: DataSource,
          useValue: {
            transaction: jest
              .fn()
              .mockImplementation(
                (fn: (manager: typeof mockManager) => Promise<SeatEntity[]>) =>
                  fn(mockManager),
              ),
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

    useCase = module.get(CreateSeatsBatchUseCase);
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create seats in batch when session is ACTIVE', async () => {
      // Arrange
      const input = { sessionId: 'session-1', labels: ['A1', 'A2'] };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toEqual(mockSeats);
      expect(mockManager.findOne).toHaveBeenCalledWith(SessionEntity, {
        where: { id: 'session-1' },
      });
      expect(mockManager.create).toHaveBeenCalledTimes(2);
      expect(mockManager.save).toHaveBeenCalledWith(
        SeatEntity,
        expect.any(Array),
      );
    });

    it('should throw NotFoundException when session does not exist', async () => {
      // Arrange
      mockManager.findOne.mockResolvedValue(null);
      i18nService.t.mockReturnValue('Session not found');
      const input = { sessionId: 'non-existent', labels: ['A1'] };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
      expect(mockManager.create).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when session is not ACTIVE', async () => {
      // Arrange
      mockManager.findOne.mockResolvedValue({
        ...mockSession,
        status: SessionStatus.FINISHED,
      });
      i18nService.t.mockReturnValue('Session is not active');
      const input = { sessionId: 'session-1', labels: ['A1'] };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
      expect(mockManager.create).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { SeatEntity } from 'src/modules/seats/entities';
import { SeatStatus } from 'src/modules/seats/enums';
import { FindSessionByIdUseCase } from '../find-one-sessions.use-case';
import { GetSeatsUseCase } from '../get-seats.use-case';

describe('GetSeatsUseCase', () => {
  let useCase: GetSeatsUseCase;
  let seatRepository: jest.Mocked<Pick<Repository<SeatEntity>, 'find'>>;
  let findSessionByIdUseCase: jest.Mocked<
    Pick<FindSessionByIdUseCase, 'execute'>
  >;

  const mockSeats: SeatEntity[] = [
    {
      id: 'seat-1',
      sessionId: 'session-1',
      label: 'A1',
      status: SeatStatus.AVAILABLE,
    } as SeatEntity,
    {
      id: 'seat-2',
      sessionId: 'session-1',
      label: 'A2',
      status: SeatStatus.RESERVED,
    } as SeatEntity,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSeatsUseCase,
        {
          provide: getRepositoryToken(SeatEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: FindSessionByIdUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    useCase = module.get(GetSeatsUseCase);
    seatRepository = module.get(getRepositoryToken(SeatEntity));
    findSessionByIdUseCase = module.get(FindSessionByIdUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return seats for a valid session ordered by label', async () => {
      // Arrange
      seatRepository.find.mockResolvedValue(mockSeats);

      // Act
      const result = await useCase.execute({ sessionId: 'session-1' });

      // Assert
      expect(result).toEqual(mockSeats);
      expect(findSessionByIdUseCase.execute).toHaveBeenCalledWith({
        id: 'session-1',
      });
      expect(seatRepository.find).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        order: { label: 'ASC' },
      });
    });

    it('should return empty array when session has no seats', async () => {
      // Arrange
      seatRepository.find.mockResolvedValue([]);

      // Act
      const result = await useCase.execute({ sessionId: 'session-1' });

      // Assert
      expect(result).toEqual([]);
    });

    it('should propagate NotFoundException from findSessionByIdUseCase', async () => {
      // Arrange
      findSessionByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Session not found'),
      );

      // Act & Assert
      await expect(
        useCase.execute({ sessionId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
      expect(seatRepository.find).not.toHaveBeenCalled();
    });
  });
});

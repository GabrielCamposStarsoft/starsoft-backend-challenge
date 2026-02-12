import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { Cache } from '@nestjs/cache-manager';
import { SeatEntity } from '../../../seats/entities';
import { FindSessionByIdUseCase } from '../find-one-sessions.use-case';
import { GetAvailabilityUseCase } from '../get-availability.use-case';

describe('GetAvailabilityUseCase', () => {
  let useCase: GetAvailabilityUseCase;
  let seatRepository: jest.Mocked<
    Pick<Repository<SeatEntity>, 'findAndCount' | 'count'>
  >;
  let cache: jest.Mocked<Pick<Cache, 'get' | 'set'>>;
  let findSessionByIdUseCase: jest.Mocked<
    Pick<FindSessionByIdUseCase, 'execute'>
  >;

  const mockSeats: SeatEntity[] = [
    {
      id: 'seat-1',
      label: 'A1',
      sessionId: 'session-1',
      status: 'available',
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SeatEntity,
  ];

  const mockAvailabilityResponse = {
    sessionId: 'session-1',
    totalSeats: 10,
    availableSeats: 1,
    seats: [{ id: 'seat-1', label: 'A1' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAvailabilityUseCase,
        {
          provide: getRepositoryToken(SeatEntity),
          useValue: {
            findAndCount: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: FindSessionByIdUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(GetAvailabilityUseCase);
    seatRepository = module.get(getRepositoryToken(SeatEntity));
    cache = module.get(CACHE_MANAGER);
    findSessionByIdUseCase = module.get(FindSessionByIdUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException when session does not exist', async () => {
      // Arrange
      findSessionByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Session not found'),
      );

      // Act & Assert
      await expect(
        useCase.execute({ sessionId: 'invalid-session' }),
      ).rejects.toThrow(NotFoundException);

      expect(findSessionByIdUseCase.execute).toHaveBeenCalledWith({
        id: 'invalid-session',
      });
      expect(cache.get).not.toHaveBeenCalled();
      expect(seatRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      // Arrange
      findSessionByIdUseCase.execute.mockResolvedValue({} as never);
      cache.get.mockResolvedValue(mockAvailabilityResponse);

      // Act
      const result = await useCase.execute({ sessionId: 'session-1' });

      // Assert
      expect(result).toEqual(mockAvailabilityResponse);
      expect(cache.get).toHaveBeenCalledWith('seats:session:session-1');
      expect(seatRepository.findAndCount).not.toHaveBeenCalled();
      expect(seatRepository.count).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache when cache is empty', async () => {
      // Arrange
      findSessionByIdUseCase.execute.mockResolvedValue({} as never);
      cache.get.mockResolvedValue(null);
      seatRepository.findAndCount.mockResolvedValue([mockSeats, 1]);
      seatRepository.count.mockResolvedValue(10);

      // Act
      const result = await useCase.execute({ sessionId: 'session-1' });

      // Assert
      expect(result).toEqual(mockAvailabilityResponse);
      expect(seatRepository.findAndCount).toHaveBeenCalledWith({
        where: { sessionId: 'session-1', status: 'available' },
      });
      expect(seatRepository.count).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
      });
      expect(cache.set).toHaveBeenCalledWith(
        'seats:session:session-1',
        mockAvailabilityResponse,
        expect.any(Number),
      );
    });
  });
});

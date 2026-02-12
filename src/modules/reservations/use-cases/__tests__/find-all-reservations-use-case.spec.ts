import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ReservationEntity } from '../../entities';
import { FindAllReservationsUseCase } from '../find-all-reservations.use-case';
import type { IFindAllReservationsInput } from '../interfaces';

describe('FindAllReservationsUseCase', () => {
  let useCase: FindAllReservationsUseCase;
  let reservationsRepository: jest.Mocked<
    Pick<Repository<ReservationEntity>, 'find' | 'count'>
  >;

  const mockReservations: ReservationEntity[] = [
    {
      id: 'res-1',
      sessionId: 'session-1',
      seatId: 'seat-1',
      userId: 'user-1',
      status: 'pending',
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ReservationEntity,
  ];

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllReservationsUseCase,
        {
          provide: getRepositoryToken(ReservationEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get(FindAllReservationsUseCase);
    reservationsRepository = module.get(getRepositoryToken(ReservationEntity));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return reservations and total count with default pagination', async () => {
      // Arrange
      reservationsRepository.find.mockResolvedValue(mockReservations);
      reservationsRepository.count.mockResolvedValue(1);

      const input = { page: 1, limit: 10 };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toEqual([mockReservations, 1]);
      expect(reservationsRepository.find).toHaveBeenCalledWith({
        where: {},
        take: 10,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
      expect(reservationsRepository.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should filter by userId when provided', async () => {
      // Arrange
      reservationsRepository.find.mockResolvedValue([]);
      reservationsRepository.count.mockResolvedValue(0);

      const input = { page: 1, limit: 10, userId: 'user-123' };

      // Act
      await useCase.execute(input);

      // Assert
      expect(reservationsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
        }),
      );
    });

    it('should filter by sessionId and status when provided', async () => {
      // Arrange
      reservationsRepository.find.mockResolvedValue([]);
      reservationsRepository.count.mockResolvedValue(0);

      const input = {
        page: 1,
        limit: 5,
        sessionId: 'session-1',
        status: 'pending' as const,
      };

      // Act
      await useCase.execute(input as IFindAllReservationsInput);

      // Assert
      expect(reservationsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId: 'session-1', status: 'pending' },
        }),
      );
    });
  });
});

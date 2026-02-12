import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import type { QueryRunner } from 'typeorm';
import { DataSource } from 'typeorm';
import { ReservationStatus } from '../../../reservations/enums';
import type { ReservationEntity } from '../../../reservations/entities';
import type { SeatEntity } from '../../../seats/entities';
import { SeatStatus } from '../../../seats/enums';
import type { SessionEntity } from '../../../sessions/entities';
import { CreateSalesUseCase } from '../create-sales.use-case';

describe('CreateSalesUseCase', () => {
  let useCase: CreateSalesUseCase;
  let mockManager: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;
  let createQueryRunnerImpl: () => QueryRunner;

  const mockReservation = {
    id: 'res-1',
    userId: 'user-1',
    seatId: 'seat-1',
    sessionId: 'session-1',
    status: ReservationStatus.PENDING,
    expiresAt: new Date(Date.now() + 60000),
  } as ReservationEntity;

  const mockSeat = {
    id: 'seat-1',
    status: SeatStatus.RESERVED,
    sessionId: 'session-1',
  } as SeatEntity;

  const mockSession = {
    id: 'session-1',
    ticketPrice: 25.5,
  } as SessionEntity;

  const mockSavedSale = {
    id: 'sale-1',
    reservationId: 'res-1',
    sessionId: 'session-1',
    seatId: 'seat-1',
    userId: 'user-1',
    amount: 25.5,
  };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    createQueryRunnerImpl = (): QueryRunner =>
      ({
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: mockManager,
      }) as unknown as QueryRunner;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSalesUseCase,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest
              .fn()
              .mockImplementation(() => createQueryRunnerImpl()),
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

    useCase = module.get(CreateSalesUseCase);
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create sale when reservation is valid', async () => {
      // Arrange
      mockManager.findOne
        .mockResolvedValueOnce(mockReservation)
        .mockResolvedValueOnce(mockSeat)
        .mockResolvedValueOnce(mockSession);
      mockManager.create.mockImplementation((_: unknown, data: object) => ({
        ...data,
      }));
      mockManager.save
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(mockSavedSale)
        .mockResolvedValueOnce(undefined);

      const input = { reservationId: 'res-1', userId: 'user-1' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.reservationId).toBe('res-1');
      expect(mockManager.findOne).toHaveBeenCalledTimes(3);
    });

    it('should throw NotFoundException when reservation does not exist', async () => {
      // Arrange
      mockManager.findOne.mockResolvedValue(null);

      const input = { reservationId: 'non-existent', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own reservation', async () => {
      // Arrange
      mockManager.findOne.mockResolvedValue(mockReservation);

      const input = { reservationId: 'res-1', userId: 'other-user' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when reservation is not PENDING', async () => {
      // Arrange
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };
      mockManager.findOne.mockResolvedValue(confirmedReservation);

      const input = { reservationId: 'res-1', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when reservation is expired', async () => {
      // Arrange - status must stay PENDING, only expiresAt in the past
      const expiredReservation = {
        id: 'res-1',
        userId: 'user-1',
        seatId: 'seat-1',
        sessionId: 'session-1',
        status: ReservationStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000),
      };
      mockManager.findOne.mockResolvedValue(expiredReservation);

      const input = { reservationId: 'res-1', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when seat does not exist', async () => {
      // Arrange - first call: reservation, second: seat (null)
      mockManager.findOne
        .mockResolvedValueOnce({
          ...mockReservation,
          status: ReservationStatus.PENDING,
        })
        .mockResolvedValueOnce(null);

      const input = { reservationId: 'res-1', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when seat is already sold', async () => {
      // Arrange
      const soldSeat = { ...mockSeat, status: SeatStatus.SOLD };
      mockManager.findOne
        .mockResolvedValueOnce(mockReservation)
        .mockResolvedValueOnce(soldSeat);

      const input = { reservationId: 'res-1', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when seat is AVAILABLE (reservation expired)', async () => {
      // Arrange - seat must be RESERVED to confirm sale
      const availableSeat = { ...mockSeat, status: SeatStatus.AVAILABLE };
      mockManager.findOne
        .mockResolvedValueOnce(mockReservation)
        .mockResolvedValueOnce(availableSeat);

      const input = { reservationId: 'res-1', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    });
  });
});

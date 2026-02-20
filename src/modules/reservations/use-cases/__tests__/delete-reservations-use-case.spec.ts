import {
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import type { EntityManager } from 'typeorm';
import { DataSource } from 'typeorm';
import { ReservationStatus } from '../../enums';
import { DeleteReservationsUseCase } from '../delete-reservations.use-case';
import type { ReservationEntity } from '../../entities';
import type { IDeleteReservationsInput } from '../interfaces';

describe('DeleteReservationsUseCase', () => {
  let useCase: DeleteReservationsUseCase;
  let dataSource: { transaction: jest.Mock };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockPendingReservation: ReservationEntity = {
    id: 'res-1',
    userId: 'user-1',
    seatId: 'seat-1',
    sessionId: 'session-1',
    status: ReservationStatus.PENDING,
  } as ReservationEntity;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteReservationsUseCase,
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    useCase = module.get(DeleteReservationsUseCase);
    dataSource = module.get(DataSource);
    i18nService = module.get(I18nService);
  });

  beforeEach((): void => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach((): void => {
    jest.restoreAllMocks();
  });

  it('should be defined', (): void => {
    expect(useCase).toBeDefined();
  });

  describe('execute', (): void => {
    it('should delete pending reservation and release seat', async () => {
      // Arrange
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockPendingReservation),
        createQueryBuilder: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        }),
        insert: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const input: IDeleteReservationsInput = { id: 'res-1', userId: 'user-1' };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockManager.findOne).toHaveBeenCalledTimes(1);
      expect(mockManager.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when reservation does not exist', async () => {
      // Arrange
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const input = { id: 'non-existent', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own reservation', async () => {
      // Arrange
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockPendingReservation),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<EntityManager>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const input: IDeleteReservationsInput = {
        id: 'res-1',
        userId: 'other-user',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when reservation is CONFIRMED', async () => {
      // Arrange
      const confirmedReservation: ReservationEntity = {
        ...mockPendingReservation,
        status: ReservationStatus.CONFIRMED,
      };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(confirmedReservation),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<EntityManager>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const input: IDeleteReservationsInput = { id: 'res-1', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when reservation is EXPIRED', async () => {
      // Arrange
      const expiredReservation: ReservationEntity = {
        ...mockPendingReservation,
        status: ReservationStatus.EXPIRED,
      };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(expiredReservation),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<EntityManager>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const input = { id: 'res-1', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when reservation is CANCELLED', async () => {
      // Arrange
      const cancelledReservation: ReservationEntity = {
        ...mockPendingReservation,
        status: ReservationStatus.CANCELLED,
      };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(cancelledReservation),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<EntityManager>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const input = { id: 'res-1', userId: 'user-1' };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    });
  });
});

import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import type { EntityManager } from 'typeorm';
import { DataSource } from 'typeorm';
import { ReservationStatus } from '../../enums';
import type { UpdateReservationsDto } from '../../dto';
import { UpdateReservationsUseCase } from '../update-reservations.use-case';
import type { ReservationEntity } from '../../entities';
import type { Optional } from 'src/common';

describe('UpdateReservationsUseCase', (): void => {
  let useCase: UpdateReservationsUseCase;
  let dataSource: { transaction: jest.Mock };

  const mockReservation: ReservationEntity = {
    id: 'res-1',
    userId: 'user-1',
    seatId: 'seat-1',
    sessionId: 'session-1',
    status: ReservationStatus.PENDING,
  } as ReservationEntity;

  const createQueryBuilderMock: (affected?: Optional<number>) => object = (
    affected: number = 1,
  ): object => {
    const chain: Record<string, jest.Mock> = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected }),
    };
    return chain;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateReservationsUseCase,
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

    useCase = module.get(UpdateReservationsUseCase);
    dataSource = module.get(DataSource);
  });

  it('should be defined', (): void => {
    expect(useCase).toBeDefined();
  });

  describe('execute', (): void => {
    it('should update reservation status to CANCELLED when user owns it', async () => {
      const seatQueryBuilder = createQueryBuilderMock(1);
      const reservationQueryBuilder = createQueryBuilderMock(1);
      const updatedReservation = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      };

      const mockManager: Pick<
        EntityManager,
        'findOne' | 'findOneOrFail' | 'insert' | 'createQueryBuilder'
      > = {
        findOne: jest.fn().mockResolvedValue(mockReservation),
        findOneOrFail: jest.fn().mockResolvedValue(updatedReservation),
        insert: jest.fn().mockResolvedValue({}),
        createQueryBuilder: jest
          .fn()
          .mockReturnValueOnce(seatQueryBuilder)
          .mockReturnValueOnce(reservationQueryBuilder),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const updateDto: UpdateReservationsDto = {
        status: ReservationStatus.CANCELLED,
      };

      const result = await useCase.execute('res-1', updateDto, 'user-1');

      expect(result).toBeDefined();
      expect(result.status).toBe(ReservationStatus.CANCELLED);
      expect(mockManager.findOne).toHaveBeenCalledTimes(1);
      expect(mockManager.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(mockManager.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(mockManager.insert).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reservationId: 'res-1',
          seatId: 'seat-1',
          sessionId: 'session-1',
          seatReleased: true,
          reason: 'cancelled',
        }),
      );
    });

    it('should throw ConflictException when transitioning PENDING to EXPIRED (only scheduler may expire)', async () => {
      const mockManager: Pick<EntityManager, 'findOne' | 'insert'> = {
        findOne: jest.fn().mockResolvedValue(mockReservation),
        insert: jest.fn(),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const updateDto: UpdateReservationsDto = {
        status: ReservationStatus.EXPIRED,
      };

      await expect(
        useCase.execute('res-1', updateDto, 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(mockManager.insert).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when transitioning PENDING to CONFIRMED (only sale flow may confirm)', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockReservation),
        insert: jest.fn(),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const updateDto: UpdateReservationsDto = {
        status: ReservationStatus.CONFIRMED,
      };

      await expect(
        useCase.execute('res-1', updateDto, 'user-1'),
      ).rejects.toThrow(ConflictException);
      expect(mockManager.insert).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when reservation does not exist', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) =>
          cb(mockManager as unknown as EntityManager),
      );

      await expect(
        useCase.execute('non-existent', {}, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own reservation', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockReservation),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) =>
          cb(mockManager as unknown as EntityManager),
      );

      await expect(
        useCase.execute(
          'res-1',
          { status: ReservationStatus.CANCELLED },
          'other-user',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException for invalid status transition', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(confirmedReservation),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) =>
          cb(mockManager as unknown as EntityManager),
      );

      await expect(
        useCase.execute(
          'res-1',
          { status: ReservationStatus.CANCELLED },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when reservation state changed concurrently', async () => {
      const seatQueryBuilder = createQueryBuilderMock(1);
      const reservationQueryBuilder = createQueryBuilderMock(0); // No rows affected

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockReservation),
        insert: jest.fn().mockResolvedValue({}),
        createQueryBuilder: jest
          .fn()
          .mockReturnValueOnce(seatQueryBuilder)
          .mockReturnValueOnce(reservationQueryBuilder),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<EntityManager>) =>
          cb(mockManager as unknown as EntityManager),
      );

      await expect(
        useCase.execute(
          'res-1',
          { status: ReservationStatus.CANCELLED },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should record seatReleased as false when seat was not RESERVED', async () => {
      const seatQueryBuilder: object = createQueryBuilderMock(0); // Seat not released (wasn't RESERVED)
      const reservationQueryBuilder: object = createQueryBuilderMock(1);
      const updatedReservation: ReservationEntity = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      };

      const mockManager: Pick<
        EntityManager,
        'findOne' | 'findOneOrFail' | 'insert' | 'createQueryBuilder'
      > = {
        findOne: jest.fn().mockResolvedValue(mockReservation),
        findOneOrFail: jest.fn().mockResolvedValue(updatedReservation),
        insert: jest.fn().mockResolvedValue({}),
        createQueryBuilder: jest
          .fn()
          .mockReturnValueOnce(seatQueryBuilder)
          .mockReturnValueOnce(reservationQueryBuilder),
      };

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<EntityManager>) =>
          cb(mockManager as unknown as EntityManager),
      );

      await useCase.execute(
        'res-1',
        { status: ReservationStatus.CANCELLED },
        'user-1',
      );

      expect(mockManager.insert).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          seatReleased: false,
          reason: 'cancelled',
        }),
      );
    });
  });
});

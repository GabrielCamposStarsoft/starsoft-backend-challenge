import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import type { EntityManager } from 'typeorm';
import { DataSource } from 'typeorm';
import { SessionStatus } from '../../../sessions/enums';
import type { SessionEntity } from '../../../sessions/entities';
import type { UserEntity } from '../../../users/entities';
import { CreateReservationsUseCase } from '../create-reservations.use-case';

interface IMockManager {
  findOne: jest.Mock;
  count: jest.Mock;
  createQueryBuilder: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
}

describe('CreateReservationsUseCase', () => {
  let useCase: CreateReservationsUseCase;
  let dataSource: { transaction: jest.Mock };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let i18nService: I18nService;

  const mockSession = {
    id: 'session-1',
    status: SessionStatus.ACTIVE,
  } as SessionEntity;

  const mockUser = { id: 'user-1' } as UserEntity;

  const createMockManager = (
    overrides?: Partial<IMockManager>,
  ): ((
    find?: IMockManager['findOne'],
    createQueryBuilder?: IMockManager['createQueryBuilder'],
    create?: IMockManager['create'],
    save?: IMockManager['save'],
  ) => EntityManager) => {
    const mockQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    return {
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(20),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      create: jest.fn().mockImplementation((_: unknown, data: object) => ({
        ...data,
        id: 'res-1',
      })),
      save: jest.fn().mockResolvedValue({}),
      ...overrides,
    } as unknown as (
      find?: IMockManager['findOne'],
      createQueryBuilder?: IMockManager['createQueryBuilder'],
      create?: IMockManager['create'],
      save?: IMockManager['save'],
    ) => EntityManager;
  };

  beforeEach(async () => {
    const transactionMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReservationsUseCase,
        {
          provide: DataSource,
          useValue: { transaction: transactionMock },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    useCase = module.get(CreateReservationsUseCase);
    dataSource = module.get(DataSource);
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create reservations when session, user exist and seats are available', async () => {
      // Arrange
      const mockManager = createMockManager() as unknown as IMockManager;
      mockManager.findOne
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(mockUser);

      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) =>
          cb(mockManager as unknown as EntityManager),
      );

      const input = {
        sessionId: 'session-1',
        seatIds: ['seat-1'],
        userId: 'user-1',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when session has fewer than 16 seats', async () => {
      // Arrange
      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) => {
          const mockManager = {
            findOne: jest.fn().mockResolvedValueOnce(mockSession),
            count: jest.fn().mockResolvedValue(10),
          };
          return cb(mockManager as unknown as EntityManager);
        },
      );

      const input = {
        sessionId: 'session-1',
        seatIds: ['seat-1'],
        userId: 'user-1',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when session does not exist', async () => {
      // Arrange
      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) => {
          const mockManager = {
            findOne: jest.fn().mockResolvedValueOnce(null),
          };
          return cb(mockManager as unknown as EntityManager);
        },
      );

      const input = {
        sessionId: 'invalid-session',
        seatIds: ['seat-1'],
        userId: 'user-1',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when session is not active', async () => {
      // Arrange
      const inactiveSession = {
        ...mockSession,
        status: SessionStatus.CANCELLED,
      };
      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) => {
          const mockManager = {
            findOne: jest
              .fn()
              .mockResolvedValueOnce(inactiveSession)
              .mockResolvedValueOnce(mockUser),
            count: jest.fn().mockResolvedValue(20),
          };
          return cb(mockManager as unknown as EntityManager);
        },
      );

      const input = {
        sessionId: 'session-1',
        seatIds: ['seat-1'],
        userId: 'user-1',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) => {
          const mockManager = {
            findOne: jest
              .fn()
              .mockResolvedValueOnce(mockSession)
              .mockResolvedValueOnce(null),
            count: jest.fn().mockResolvedValue(20),
          };
          return cb(mockManager as unknown as EntityManager);
        },
      );

      const input = {
        sessionId: 'session-1',
        seatIds: ['seat-1'],
        userId: 'invalid-user',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when seat is not available', async () => {
      // Arrange - seat exists in session but is reserved/sold (affected: 0)
      const seatInSession = { id: 'unavailable-seat', sessionId: 'session-1' };
      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) => {
          const mockManager = {
            findOne: jest
              .fn()
              .mockResolvedValueOnce(mockSession)
              .mockResolvedValueOnce(mockUser)
              .mockResolvedValueOnce(seatInSession),
            count: jest.fn().mockResolvedValue(20),
            createQueryBuilder: jest.fn().mockReturnValue({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 0 }),
            }),
          };
          return cb(mockManager as unknown as EntityManager);
        },
      );

      const input = {
        sessionId: 'session-1',
        seatIds: ['unavailable-seat'],
        userId: 'user-1',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when seat does not belong to session', async () => {
      // Arrange - seat exists but in different session
      const seatInOtherSession = {
        id: 'seat-other-session',
        sessionId: 'other-session-id',
      };
      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) => {
          const mockManager = {
            findOne: jest
              .fn()
              .mockResolvedValueOnce(mockSession)
              .mockResolvedValueOnce(mockUser)
              .mockResolvedValueOnce(seatInOtherSession),
            count: jest.fn().mockResolvedValue(20),
            createQueryBuilder: jest.fn().mockReturnValue({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 0 }),
            }),
          };
          return cb(mockManager as unknown as EntityManager);
        },
      );

      const input = {
        sessionId: 'session-1',
        seatIds: ['seat-other-session'],
        userId: 'user-1',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when seat does not exist', async () => {
      // Arrange
      dataSource.transaction.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<unknown>) => {
          const mockManager = {
            findOne: jest
              .fn()
              .mockResolvedValueOnce(mockSession)
              .mockResolvedValueOnce(mockUser)
              .mockResolvedValueOnce(null),
            count: jest.fn().mockResolvedValue(20),
            createQueryBuilder: jest.fn().mockReturnValue({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 0 }),
            }),
          };
          return cb(mockManager as unknown as EntityManager);
        },
      );

      const input = {
        sessionId: 'session-1',
        seatIds: ['non-existent-seat'],
        userId: 'user-1',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    });
  });
});

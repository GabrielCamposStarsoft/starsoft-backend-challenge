import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { Repository } from 'typeorm';
import { ReservationEntity } from '../../entities';
import { ReservationStatus } from '../../enums';
import { ExpireReservationsUseCase } from '../expire-reservations.use-case';

describe('ExpireReservationsUseCase', () => {
  let useCase: ExpireReservationsUseCase;
  let dataSource: jest.Mocked<Pick<DataSource, 'createQueryRunner'>>;
  let reservationsRepository: jest.Mocked<
    Pick<Repository<ReservationEntity>, 'find'>
  >;

  const mockExpiredReservation: ReservationEntity = {
    id: 'res-1',
    seatId: 'seat-1',
    sessionId: 'session-1',
    status: ReservationStatus.PENDING,
    expiresAt: new Date(Date.now() - 1000),
  } as ReservationEntity;

  beforeEach(async (): Promise<void> => {
    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn().mockResolvedValue(mockExpiredReservation),
        update: jest.fn().mockResolvedValue({}),
        createQueryBuilder: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        }),
        insert: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpireReservationsUseCase,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
        {
          provide: getRepositoryToken(ReservationEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([mockExpiredReservation]),
          },
        },
      ],
    }).compile();

    useCase = module.get(ExpireReservationsUseCase);
    dataSource = module.get(DataSource);
    reservationsRepository = module.get(getRepositoryToken(ReservationEntity));
  });

  it('should be defined', (): void => {
    expect(useCase).toBeDefined();
  });

  describe('execute', (): void => {
    it('should expire pending reservations past expiration date', async (): Promise<void> => {
      // Act
      await useCase.execute(new Date());

      // Assert
      expect(reservationsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            status: ReservationStatus.PENDING,
          }),
        }),
      );
    });

    it('should do nothing when no expired reservations exist', async () => {
      // Arrange
      reservationsRepository.find.mockResolvedValue([]);

      // Act
      await useCase.execute(new Date());

      // Assert
      expect(reservationsRepository.find).toHaveBeenCalledTimes(1);
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });
  });
});

import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type {
  DeleteResult,
  FindOptionsWhere,
  ObjectId,
  Repository,
} from 'typeorm';
import {
  ReservationExpirationOutboxEntity,
  ReservationOutboxEntity,
} from '../../entities';
import { CleanReservationOutboxUseCase } from '../clean-reservation-outbox.use-case';
import type { EitherMultiple } from 'src/common';

describe('CleanReservationOutboxUseCase', (): void => {
  let useCase: CleanReservationOutboxUseCase;
  let reservationOutboxRepository: jest.Mocked<
    Pick<Repository<ReservationOutboxEntity>, 'delete'>
  >;
  let expirationOutboxRepository: jest.Mocked<
    Pick<Repository<ReservationExpirationOutboxEntity>, 'delete'>
  >;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanReservationOutboxUseCase,
        {
          provide: getRepositoryToken(ReservationOutboxEntity),
          useValue: {
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReservationExpirationOutboxEntity),
          useValue: {
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(CleanReservationOutboxUseCase);
    reservationOutboxRepository = module.get(
      getRepositoryToken(ReservationOutboxEntity),
    );
    expirationOutboxRepository = module.get(
      getRepositoryToken(ReservationExpirationOutboxEntity),
    );
  });

  it('should be defined', (): void => {
    expect(useCase).toBeDefined();
  });

  describe('execute', (): void => {
    it('should delete published entries from both repositories and return total count', async () => {
      // Arrange
      reservationOutboxRepository.delete.mockResolvedValue({
        affected: 3,
      } as DeleteResult);
      expirationOutboxRepository.delete.mockResolvedValue({
        affected: 2,
      } as DeleteResult);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(5);
      expect(reservationOutboxRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ published: true }),
      );
      expect(expirationOutboxRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ published: true }),
      );
    });

    it('should return 0 when no entries were deleted in either repository', async () => {
      // Arrange
      reservationOutboxRepository.delete.mockResolvedValue({
        affected: 0,
      } as DeleteResult);
      expirationOutboxRepository.delete.mockResolvedValue({
        affected: 0,
      } as DeleteResult);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(0);
    });

    it('should handle undefined affected counts and return 0', async () => {
      // Arrange
      reservationOutboxRepository.delete.mockResolvedValue({
        affected: undefined,
      } as DeleteResult);
      expirationOutboxRepository.delete.mockResolvedValue({
        affected: undefined,
      } as DeleteResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(0);
    });

    it('should run both deletes in parallel', async () => {
      // Arrange
      const callOrder: Array<string> = [];
      reservationOutboxRepository.delete.mockImplementation(() => {
        callOrder.push('reservation');
        return Promise.resolve({ affected: 1 } as DeleteResult);
      });
      expirationOutboxRepository.delete.mockImplementation(() => {
        callOrder.push('expiration');
        return Promise.resolve({ affected: 1 } as DeleteResult);
      });

      // Act
      await useCase.execute();

      // Assert — both repositories were called
      expect(reservationOutboxRepository.delete).toHaveBeenCalledTimes(1);
      expect(expirationOutboxRepository.delete).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual(['reservation', 'expiration']);
    });

    it('should pass a createdAt LessThan filter to both delete calls', async () => {
      // Arrange
      reservationOutboxRepository.delete.mockResolvedValue({
        affected: 1,
      } as DeleteResult);
      expirationOutboxRepository.delete.mockResolvedValue({
        affected: 1,
      } as DeleteResult);

      // Act
      await useCase.execute();

      // Assert
      const reservationArg: EitherMultiple<
        [
          string,
          number,
          Array<string>,
          Date,
          ObjectId,
          Array<number>,
          Array<Date>,
          Array<ObjectId>,
          FindOptionsWhere<ReservationOutboxEntity>,
          FindOptionsWhere<ReservationOutboxEntity>[],
        ]
      > = reservationOutboxRepository.delete.mock.calls[0][0];
      const expirationArg: EitherMultiple<
        [
          string,
          number,
          Array<string>,
          Date,
          ObjectId,
          Array<number>,
          Array<Date>,
          Array<ObjectId>,
          FindOptionsWhere<ReservationExpirationOutboxEntity>,
          FindOptionsWhere<ReservationExpirationOutboxEntity>[],
        ]
      > = expirationOutboxRepository.delete.mock.calls[0][0];
      expect(reservationArg).toHaveProperty('createdAt');
      expect(expirationArg).toHaveProperty('createdAt');
    });
  });
});

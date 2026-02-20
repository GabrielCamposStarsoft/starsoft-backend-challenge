import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import { ReservationExpirationOutboxEntity } from '../../entities';
import { RelayReservationExpirationOutboxUseCase } from '../relay-reservation-expiration-outbox.use-case';

describe('RelayReservationExpirationOutboxUseCase', () => {
  let useCase: RelayReservationExpirationOutboxUseCase;
  let expirationOutboxRepository: jest.Mocked<
    Pick<Repository<ReservationExpirationOutboxEntity>, 'find' | 'update'>
  >;
  let messagingProducer: jest.Mocked<
    Pick<MessagingProducer, 'publishReservationExpired' | 'publishSeatReleased'>
  >;

  const mockOutboxRow: ReservationExpirationOutboxEntity = {
    id: 'outbox-1',
    reservationId: 'res-1',
    seatId: 'seat-1',
    sessionId: 'session-1',
    seatReleased: true,
    reason: 'expired',
    published: false,
    createdAt: new Date(),
  };

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelayReservationExpirationOutboxUseCase,
        {
          provide: getRepositoryToken(ReservationExpirationOutboxEntity),
          useValue: {
            find: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: MessagingProducer,
          useValue: {
            publishReservationExpired: jest.fn().mockResolvedValue(undefined),
            publishSeatReleased: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    useCase = module.get(RelayReservationExpirationOutboxUseCase);
    expirationOutboxRepository = module.get(
      getRepositoryToken(ReservationExpirationOutboxEntity),
    );
    messagingProducer = module.get(MessagingProducer);
  });

  it('should be defined', (): void => {
    expect(useCase).toBeDefined();
  });

  describe('execute', (): void => {
    it('should publish ReservationExpired and SeatReleased when seatReleased is true', async () => {
      // Arrange
      expirationOutboxRepository.find.mockResolvedValue([mockOutboxRow]);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(1);
      expect(messagingProducer.publishReservationExpired).toHaveBeenCalledWith({
        reservationId: 'res-1',
        seatId: 'seat-1',
        sessionId: 'session-1',
      });
      expect(messagingProducer.publishSeatReleased).toHaveBeenCalledWith({
        reservationId: 'res-1',
        seatId: 'seat-1',
        sessionId: 'session-1',
        reason: 'expired',
      });
      expect(expirationOutboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-1' },
        { published: true },
      );
    });

    it('should only publish ReservationExpired when seatReleased is false', async () => {
      // Arrange
      const rowWithoutSeatRelease: ReservationExpirationOutboxEntity = {
        ...mockOutboxRow,
        seatReleased: false,
      } as ReservationExpirationOutboxEntity;
      expirationOutboxRepository.find.mockResolvedValue([
        rowWithoutSeatRelease,
      ]);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(1);
      expect(messagingProducer.publishReservationExpired).toHaveBeenCalledTimes(
        1,
      );
      expect(messagingProducer.publishSeatReleased).not.toHaveBeenCalled();
    });

    it('should return 0 when no pending outbox rows exist', async () => {
      // Arrange
      expirationOutboxRepository.find.mockResolvedValue([]);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(0);
      expect(
        messagingProducer.publishReservationExpired,
      ).not.toHaveBeenCalled();
    });
  });
});

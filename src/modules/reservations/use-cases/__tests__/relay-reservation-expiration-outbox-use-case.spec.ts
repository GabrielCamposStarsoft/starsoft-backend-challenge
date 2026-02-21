import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import { ReservationExpirationOutboxEntity } from '../../entities';
import { RelayReservationExpirationOutboxUseCase } from '../relay-reservation-expiration-outbox.use-case';
import { BASE_RETRY_DELAY_MS, MAX_RETRY_DELAY_MS } from '../../constants';

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
    retryCount: 0,
    nextRetryAt: null,
    createdAt: new Date(),
  } as ReservationExpirationOutboxEntity;

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

    it('should update retryCount and nextRetryAt when publish fails', async (): Promise<void> => {
      // Arrange
      expirationOutboxRepository.find.mockResolvedValue([mockOutboxRow]);
      messagingProducer.publishReservationExpired.mockRejectedValueOnce(
        new Error('broker unavailable'),
      );

      // Act
      const before = Date.now();
      const result: number = await useCase.execute();
      const after = Date.now();

      // Assert
      expect(result).toBe(0);
      expect(messagingProducer.publishSeatReleased).not.toHaveBeenCalled();
      expect(expirationOutboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-1' },
        expect.objectContaining({
          retryCount: 1,
          nextRetryAt: expect.any(Date) as Date,
        }),
      );
      const nextRetryAt = (
        expirationOutboxRepository.update.mock.calls[0][1] as unknown as {
          nextRetryAt: Date;
        }
      ).nextRetryAt;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(
        before + BASE_RETRY_DELAY_MS,
      );
      expect(nextRetryAt.getTime()).toBeLessThanOrEqual(
        after + BASE_RETRY_DELAY_MS,
      );
    });

    it('should double the delay on each subsequent retry', async (): Promise<void> => {
      // Arrange
      const rowWithPriorRetries: ReservationExpirationOutboxEntity = {
        ...mockOutboxRow,
        retryCount: 2,
      } as ReservationExpirationOutboxEntity;
      expirationOutboxRepository.find.mockResolvedValue([rowWithPriorRetries]);
      messagingProducer.publishReservationExpired.mockRejectedValueOnce(
        new Error('broker unavailable'),
      );

      // Act
      const before = Date.now();
      await useCase.execute();
      const after = Date.now();

      // Assert — delay = 30s * 2^2 = 120_000ms
      const expectedDelay = BASE_RETRY_DELAY_MS * Math.pow(2, 2);
      const nextRetryAt = (
        expirationOutboxRepository.update.mock.calls[0][1] as unknown as {
          nextRetryAt: Date;
        }
      ).nextRetryAt;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(
        before + expectedDelay,
      );
      expect(nextRetryAt.getTime()).toBeLessThanOrEqual(after + expectedDelay);
    });

    it('should cap delay at MAX_RETRY_DELAY_MS when retryCount is high', async (): Promise<void> => {
      // Arrange — retryCount=8 → 30s * 2^8 = 7680s > MAX_RETRY_DELAY_MS (3600s)
      const rowNearMax: ReservationExpirationOutboxEntity = {
        ...mockOutboxRow,
        retryCount: 8,
      } as ReservationExpirationOutboxEntity;
      expirationOutboxRepository.find.mockResolvedValue([rowNearMax]);
      messagingProducer.publishReservationExpired.mockRejectedValueOnce(
        new Error('broker unavailable'),
      );

      // Act
      const before = Date.now();
      await useCase.execute();
      const after = Date.now();

      // Assert
      const nextRetryAt = (
        expirationOutboxRepository.update.mock.calls[0][1] as unknown as {
          nextRetryAt: Date;
        }
      ).nextRetryAt;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(
        before + MAX_RETRY_DELAY_MS,
      );
      expect(nextRetryAt.getTime()).toBeLessThanOrEqual(
        after + MAX_RETRY_DELAY_MS,
      );
    });

    it('should continue processing remaining rows when one fails', async (): Promise<void> => {
      // Arrange
      const secondRow: ReservationExpirationOutboxEntity = {
        ...mockOutboxRow,
        id: 'outbox-2',
      } as ReservationExpirationOutboxEntity;
      expirationOutboxRepository.find.mockResolvedValue([
        mockOutboxRow,
        secondRow,
      ]);
      messagingProducer.publishReservationExpired
        .mockRejectedValueOnce(new Error('publish error'))
        .mockResolvedValueOnce(undefined);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(1);
      expect(messagingProducer.publishReservationExpired).toHaveBeenCalledTimes(
        2,
      );
      expect(expirationOutboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-1' },
        expect.objectContaining({
          retryCount: 1,
          nextRetryAt: expect.any(Date) as Date,
        }),
      );
      expect(expirationOutboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-2' },
        { published: true },
      );
    });

    it('should query with array where clause for backoff and retry-count filtering', async (): Promise<void> => {
      // Arrange
      expirationOutboxRepository.find.mockResolvedValue([]);

      // Act
      await useCase.execute();

      // Assert
      expect(expirationOutboxRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.arrayContaining([
            expect.objectContaining({ published: false }),
            expect.objectContaining({ published: false }),
          ]),
          order: { createdAt: 'ASC' },
        }),
      );
    });
  });
});

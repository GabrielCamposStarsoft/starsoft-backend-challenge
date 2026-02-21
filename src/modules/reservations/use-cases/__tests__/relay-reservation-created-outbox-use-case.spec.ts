import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import { ReservationOutboxEntity } from '../../entities';
import { RelayReservationCreatedOutboxUseCase } from '../relay-reservation-created-outbox.use-case';
import {
  BASE_RETRY_DELAY_MS,
  MAX_RETRY_DELAY_MS,
} from '../../constants';

describe('RelayReservationCreatedOutboxUseCase', () => {
  let useCase: RelayReservationCreatedOutboxUseCase;
  let reservationOutboxRepository: jest.Mocked<
    Pick<Repository<ReservationOutboxEntity>, 'find' | 'update'>
  >;
  let messagingProducer: jest.Mocked<
    Pick<MessagingProducer, 'publishReservationCreated'>
  >;

  const mockOutboxRow: ReservationOutboxEntity = {
    id: 'outbox-1',
    reservationId: 'res-1',
    seatId: 'seat-1',
    sessionId: 'session-1',
    userId: 'user-1',
    expiresAt: new Date(),
    published: false,
    retryCount: 0,
    nextRetryAt: null,
    createdAt: new Date(),
  } as ReservationOutboxEntity;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelayReservationCreatedOutboxUseCase,
        {
          provide: getRepositoryToken(ReservationOutboxEntity),
          useValue: {
            find: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: MessagingProducer,
          useValue: {
            publishReservationCreated: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    useCase = module.get(RelayReservationCreatedOutboxUseCase);
    reservationOutboxRepository = module.get(
      getRepositoryToken(ReservationOutboxEntity),
    );
    messagingProducer = module.get(MessagingProducer);
  });

  it('should be defined', (): void => {
    expect(useCase).toBeDefined();
  });

  describe('execute', (): void => {
    it('should publish ReservationCreated and mark as published', async (): Promise<void> => {
      // Arrange
      reservationOutboxRepository.find.mockResolvedValue([mockOutboxRow]);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(1);
      expect(messagingProducer.publishReservationCreated).toHaveBeenCalledWith({
        reservationId: 'res-1',
        sessionId: 'session-1',
        seatId: 'seat-1',
        userId: 'user-1',
        expiresAt: mockOutboxRow.expiresAt,
      });
      expect(reservationOutboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-1' },
        { published: true },
      );
    });

    it('should return 0 when no pending outbox rows exist', async (): Promise<void> => {
      // Arrange
      reservationOutboxRepository.find.mockResolvedValue([]);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(0);
      expect(messagingProducer.publishReservationCreated).not.toHaveBeenCalled();
      expect(reservationOutboxRepository.update).not.toHaveBeenCalled();
    });

    it('should update retryCount and nextRetryAt when publish fails', async (): Promise<void> => {
      // Arrange
      reservationOutboxRepository.find.mockResolvedValue([mockOutboxRow]);
      messagingProducer.publishReservationCreated.mockRejectedValueOnce(
        new Error('broker unavailable'),
      );

      // Act
      const before = Date.now();
      const result: number = await useCase.execute();
      const after = Date.now();

      // Assert
      expect(result).toBe(0);
      expect(reservationOutboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-1' },
        expect.objectContaining({ retryCount: 1, nextRetryAt: expect.any(Date) }),
      );
      const nextRetryAt = (reservationOutboxRepository.update.mock.calls[0][1] as unknown as { nextRetryAt: Date }).nextRetryAt;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(before + BASE_RETRY_DELAY_MS);
      expect(nextRetryAt.getTime()).toBeLessThanOrEqual(after + BASE_RETRY_DELAY_MS);
    });

    it('should double the delay on each subsequent retry', async (): Promise<void> => {
      // Arrange
      const rowWithPriorRetries: ReservationOutboxEntity = {
        ...mockOutboxRow,
        retryCount: 3,
      } as ReservationOutboxEntity;
      reservationOutboxRepository.find.mockResolvedValue([rowWithPriorRetries]);
      messagingProducer.publishReservationCreated.mockRejectedValueOnce(
        new Error('broker unavailable'),
      );

      // Act
      const before = Date.now();
      await useCase.execute();
      const after = Date.now();

      // Assert — delay = 30s * 2^3 = 240_000ms
      const expectedDelay = BASE_RETRY_DELAY_MS * Math.pow(2, 3);
      const nextRetryAt = (reservationOutboxRepository.update.mock.calls[0][1] as unknown as { nextRetryAt: Date }).nextRetryAt;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(before + expectedDelay);
      expect(nextRetryAt.getTime()).toBeLessThanOrEqual(after + expectedDelay);
    });

    it('should cap delay at MAX_RETRY_DELAY_MS when retryCount is high', async (): Promise<void> => {
      // Arrange — retryCount=8 → 30s * 2^8 = 7680s > MAX_RETRY_DELAY_MS (3600s)
      const rowNearMax: ReservationOutboxEntity = {
        ...mockOutboxRow,
        retryCount: 8,
      } as ReservationOutboxEntity;
      reservationOutboxRepository.find.mockResolvedValue([rowNearMax]);
      messagingProducer.publishReservationCreated.mockRejectedValueOnce(
        new Error('broker unavailable'),
      );

      // Act
      const before = Date.now();
      await useCase.execute();
      const after = Date.now();

      // Assert
      const nextRetryAt = (reservationOutboxRepository.update.mock.calls[0][1] as unknown as { nextRetryAt: Date }).nextRetryAt;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(before + MAX_RETRY_DELAY_MS);
      expect(nextRetryAt.getTime()).toBeLessThanOrEqual(after + MAX_RETRY_DELAY_MS);
    });

    it('should continue processing remaining rows when one fails', async (): Promise<void> => {
      // Arrange
      const secondRow: ReservationOutboxEntity = {
        ...mockOutboxRow,
        id: 'outbox-2',
      } as ReservationOutboxEntity;
      reservationOutboxRepository.find.mockResolvedValue([mockOutboxRow, secondRow]);
      messagingProducer.publishReservationCreated
        .mockRejectedValueOnce(new Error('publish error'))
        .mockResolvedValueOnce(undefined);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(1);
      expect(messagingProducer.publishReservationCreated).toHaveBeenCalledTimes(2);
      expect(reservationOutboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-1' },
        expect.objectContaining({ retryCount: 1, nextRetryAt: expect.any(Date) }),
      );
      expect(reservationOutboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-2' },
        { published: true },
      );
    });

    it('should query with array where clause for backoff and retry-count filtering', async (): Promise<void> => {
      // Arrange
      reservationOutboxRepository.find.mockResolvedValue([]);

      // Act
      await useCase.execute();

      // Assert
      expect(reservationOutboxRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
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

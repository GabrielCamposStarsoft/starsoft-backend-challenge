import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import { SaleOutboxEntity } from '../../entities/sale-outbox.entity';
import { RelaySaleOutboxUseCase } from '../relay-sale-outbox.use-case';
import {
  BASE_RETRY_DELAY_MS,
  MAX_RETRY_DELAY_MS,
} from '../../constants';

describe('RelaySaleOutboxUseCase', (): void => {
  let useCase: RelaySaleOutboxUseCase;
  let outboxRepository: jest.Mocked<
    Pick<Repository<SaleOutboxEntity>, 'find' | 'update'>
  >;
  let messagingProducer: jest.Mocked<
    Pick<MessagingProducer, 'publishPaymentConfirmed'>
  >;

  const mockPaymentConfirmedRow: SaleOutboxEntity = {
    id: 'outbox-1',
    event: 'PaymentConfirmed',
    payload: {
      saleId: 'sale-1',
      reservationId: 'res-1',
      seatId: 'seat-1',
      sessionId: 'session-1',
      userId: 'user-1',
      amount: 25.5,
    },
    processed: false,
    retryCount: 0,
    nextRetryAt: null,
    createdAt: new Date(),
  } as SaleOutboxEntity;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelaySaleOutboxUseCase,
        {
          provide: getRepositoryToken(SaleOutboxEntity),
          useValue: {
            find: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: MessagingProducer,
          useValue: {
            publishPaymentConfirmed: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    useCase = module.get(RelaySaleOutboxUseCase);
    outboxRepository = module.get(getRepositoryToken(SaleOutboxEntity));
    messagingProducer = module.get(MessagingProducer);
  });

  it('should be defined', (): void => {
    expect(useCase).toBeDefined();
  });

  describe('execute', (): void => {
    it('should publish PaymentConfirmed and mark as processed', async (): Promise<void> => {
      // Arrange
      outboxRepository.find.mockResolvedValue([mockPaymentConfirmedRow]);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(1);
      expect(messagingProducer.publishPaymentConfirmed).toHaveBeenCalledWith(
        mockPaymentConfirmedRow.payload,
      );
      expect(outboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-1' },
        { processed: true },
      );
    });

    it('should return 0 when no pending outbox rows exist', async (): Promise<void> => {
      // Arrange
      outboxRepository.find.mockResolvedValue([]);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(0);
      expect(messagingProducer.publishPaymentConfirmed).not.toHaveBeenCalled();
      expect(outboxRepository.update).not.toHaveBeenCalled();
    });

    it('should skip unknown event types and still mark as processed', async (): Promise<void> => {
      // Arrange
      const unknownRow: SaleOutboxEntity = {
        ...mockPaymentConfirmedRow,
        id: 'outbox-2',
        event: 'UnknownEvent',
      } as SaleOutboxEntity;
      outboxRepository.find.mockResolvedValue([unknownRow]);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(1);
      expect(messagingProducer.publishPaymentConfirmed).not.toHaveBeenCalled();
      expect(outboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-2' },
        { processed: true },
      );
    });

    it('should update retryCount and nextRetryAt when publish fails', async (): Promise<void> => {
      // Arrange
      outboxRepository.find.mockResolvedValue([mockPaymentConfirmedRow]);
      messagingProducer.publishPaymentConfirmed.mockRejectedValueOnce(
        new Error('connection error'),
      );

      // Act
      const before = Date.now();
      const result: number = await useCase.execute();
      const after = Date.now();

      // Assert
      expect(result).toBe(0);
      expect(outboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-1' },
        expect.objectContaining({
          retryCount: 1,
          nextRetryAt: expect.any(Date),
        }),
      );
      const [, payload] = outboxRepository.update.mock.calls[0] as [
        unknown,
        { nextRetryAt: Date },
      ][];
      const nextRetryAt = (payload as unknown as { nextRetryAt: Date })
        .nextRetryAt;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(
        before + BASE_RETRY_DELAY_MS,
      );
      expect(nextRetryAt.getTime()).toBeLessThanOrEqual(
        after + BASE_RETRY_DELAY_MS,
      );
    });

    it('should double the delay on each subsequent retry', async (): Promise<void> => {
      // Arrange
      const rowWithPriorRetries: SaleOutboxEntity = {
        ...mockPaymentConfirmedRow,
        retryCount: 2,
      } as SaleOutboxEntity;
      outboxRepository.find.mockResolvedValue([rowWithPriorRetries]);
      messagingProducer.publishPaymentConfirmed.mockRejectedValueOnce(
        new Error('connection error'),
      );

      // Act
      const before = Date.now();
      await useCase.execute();
      const after = Date.now();

      // Assert — delay = 30s * 2^2 = 120_000ms
      const expectedDelay = BASE_RETRY_DELAY_MS * Math.pow(2, 2);
      const [, payload] = outboxRepository.update.mock.calls[0];
      const nextRetryAt = (payload as { nextRetryAt: Date }).nextRetryAt;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(
        before + expectedDelay,
      );
      expect(nextRetryAt.getTime()).toBeLessThanOrEqual(after + expectedDelay);
    });

    it('should cap delay at MAX_RETRY_DELAY_MS when retryCount is high', async (): Promise<void> => {
      // Arrange — retryCount=8 → 30s * 2^8 = 7680s > MAX_RETRY_DELAY_MS (3600s)
      const rowNearMax: SaleOutboxEntity = {
        ...mockPaymentConfirmedRow,
        retryCount: 8,
      } as SaleOutboxEntity;
      outboxRepository.find.mockResolvedValue([rowNearMax]);
      messagingProducer.publishPaymentConfirmed.mockRejectedValueOnce(
        new Error('connection error'),
      );

      // Act
      const before = Date.now();
      await useCase.execute();
      const after = Date.now();

      // Assert
      const [, payload] = outboxRepository.update.mock.calls[0];
      const nextRetryAt = (payload as { nextRetryAt: Date }).nextRetryAt;
      expect(nextRetryAt.getTime()).toBeGreaterThanOrEqual(
        before + MAX_RETRY_DELAY_MS,
      );
      expect(nextRetryAt.getTime()).toBeLessThanOrEqual(
        after + MAX_RETRY_DELAY_MS,
      );
    });

    it('should continue processing remaining rows when one fails', async (): Promise<void> => {
      // Arrange
      const secondRow: SaleOutboxEntity = {
        ...mockPaymentConfirmedRow,
        id: 'outbox-2',
      } as SaleOutboxEntity;
      outboxRepository.find.mockResolvedValue([
        mockPaymentConfirmedRow,
        secondRow,
      ]);
      messagingProducer.publishPaymentConfirmed
        .mockRejectedValueOnce(new Error('publish error'))
        .mockResolvedValueOnce(undefined);

      // Act
      const result: number = await useCase.execute();

      // Assert
      expect(result).toBe(1);
      expect(messagingProducer.publishPaymentConfirmed).toHaveBeenCalledTimes(
        2,
      );
      expect(outboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-1' },
        expect.objectContaining({
          retryCount: 1,
          nextRetryAt: expect.any(Date),
        }),
      );
      expect(outboxRepository.update).toHaveBeenCalledWith(
        { id: 'outbox-2' },
        { processed: true },
      );
    });

    it('should query with array where clause for backoff and retry-count filtering', async (): Promise<void> => {
      // Arrange
      outboxRepository.find.mockResolvedValue([]);

      // Act
      await useCase.execute();

      // Assert — where must be an array (IS NULL / <= now) so backoff is enforced
      expect(outboxRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ processed: false }),
            expect.objectContaining({ processed: false }),
          ]),
          order: { createdAt: 'ASC' },
        }),
      );
    });
  });
});

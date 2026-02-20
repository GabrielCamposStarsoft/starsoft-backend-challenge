import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import { SaleOutboxEntity } from '../../entities/sale-outbox.entity';
import { RelaySaleOutboxUseCase } from '../relay-sale-outbox.use-case';

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

    it('should continue processing remaining rows when one fails', async () => {
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
    });

    it('should fetch unprocessed events ordered by createdAt ASC', async () => {
      // Arrange
      outboxRepository.find.mockResolvedValue([]);

      // Act
      await useCase.execute();

      // Assert
      expect(outboxRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { processed: false },
          order: { createdAt: 'ASC' },
        }),
      );
    });
  });
});

import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { MessagingProducer } from 'src/core';
import { ReservationOutboxEntity } from '../../entities';
import { RelayReservationCreatedOutboxUseCase } from '../relay-reservation-created-outbox.use-case';

describe('RelayReservationCreatedOutboxUseCase', () => {
  let useCase: RelayReservationCreatedOutboxUseCase;
  let reservationOutboxRepository: jest.Mocked<
    Pick<Repository<ReservationOutboxEntity>, 'find' | 'update'>
  >;
  let messagingProducer: jest.Mocked<
    Pick<MessagingProducer, 'publishReservationCreated'>
  >;

  const mockOutboxRow = {
    id: 'outbox-1',
    reservationId: 'res-1',
    seatId: 'seat-1',
    sessionId: 'session-1',
    userId: 'user-1',
    expiresAt: new Date(),
    published: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
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

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should publish ReservationCreated and mark as published', async () => {
      // Arrange
      reservationOutboxRepository.find.mockResolvedValue([
        mockOutboxRow as ReservationOutboxEntity,
      ]);

      // Act
      const result = await useCase.execute();

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

    it('should return 0 when no pending outbox rows exist', async () => {
      // Arrange
      reservationOutboxRepository.find.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(0);
      expect(
        messagingProducer.publishReservationCreated,
      ).not.toHaveBeenCalled();
    });
  });
});

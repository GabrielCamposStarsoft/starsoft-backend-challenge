import { Logger, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { Repository } from 'typeorm';
import { ReservationEntity } from '../../entities';
import { FindByIdReservationUseCase } from '../find-by-id-reservations.use-case';

describe('FindByIdReservationUseCase', () => {
  let useCase: FindByIdReservationUseCase;
  let reservationsRepository: jest.Mocked<
    Pick<Repository<ReservationEntity>, 'findOne'>
  >;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockReservation: ReservationEntity = {
    id: 'res-1',
    sessionId: 'session-1',
    seatId: 'seat-1',
    userId: 'user-1',
    status: 'pending',
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ReservationEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindByIdReservationUseCase,
        {
          provide: getRepositoryToken(ReservationEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    useCase = module.get(FindByIdReservationUseCase);
    reservationsRepository = module.get(getRepositoryToken(ReservationEntity));
    i18nService = module.get(I18nService);
  });

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return reservation when found by id', async () => {
      // Arrange
      reservationsRepository.findOne.mockResolvedValue(mockReservation);

      // Act
      const result = await useCase.execute({ id: 'res-1' });

      // Assert
      expect(result).toEqual(mockReservation);
      expect(reservationsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'res-1' },
      });
    });

    it('should throw NotFoundException when reservation is not found', async () => {
      // Arrange
      reservationsRepository.findOne.mockResolvedValue(null);
      i18nService.t.mockReturnValue('Reservation not found');

      // Act & Assert
      await expect(useCase.execute({ id: 'non-existent' })).rejects.toThrow(
        NotFoundException,
      );

      expect(i18nService.t).toHaveBeenCalledWith('common.reservation.notFound');
    });
  });
});

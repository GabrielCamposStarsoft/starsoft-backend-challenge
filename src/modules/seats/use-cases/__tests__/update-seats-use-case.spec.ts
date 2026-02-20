import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { Repository } from 'typeorm';
import { SeatEntity } from '../../entities';
import { SeatStatus } from '../../enums';
import { UpdateSeatsUseCase } from '../update-seats.use-case';

describe('UpdateSeatsUseCase', () => {
  let useCase: UpdateSeatsUseCase;
  let seatRepository: jest.Mocked<
    Pick<Repository<SeatEntity>, 'findOne' | 'save'>
  >;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockSeat: SeatEntity = {
    id: 'seat-1',
    sessionId: 'session-1',
    label: 'A1',
    status: SeatStatus.AVAILABLE,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SeatEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSeatsUseCase,
        {
          provide: getRepositoryToken(SeatEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
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

    useCase = module.get(UpdateSeatsUseCase);
    seatRepository = module.get(getRepositoryToken(SeatEntity));
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update seat status when seat exists', async () => {
      // Arrange
      const updatedSeat = { ...mockSeat, status: SeatStatus.BLOCKED };
      seatRepository.findOne.mockResolvedValue(mockSeat);
      seatRepository.save.mockResolvedValue(updatedSeat as SeatEntity);

      const input = { id: 'seat-1', status: SeatStatus.BLOCKED };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toEqual(updatedSeat);
      expect(seatRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'seat-1' },
      });
      expect(seatRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: SeatStatus.BLOCKED }),
      );
    });

    it('should throw NotFoundException when seat does not exist', async () => {
      // Arrange
      seatRepository.findOne.mockResolvedValue(null);
      i18nService.t.mockReturnValue('Seat not found');

      const input = { id: 'non-existent', status: SeatStatus.BLOCKED };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
      expect(seatRepository.save).not.toHaveBeenCalled();
    });

    it('should pass the i18n key with seat id when seat not found', async () => {
      // Arrange
      seatRepository.findOne.mockResolvedValue(null);
      i18nService.t.mockReturnValue('Seat not found');

      const input = { id: 'seat-xyz', status: SeatStatus.MAINTENANCE };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
      expect(i18nService.t).toHaveBeenCalledWith('common.seat.notFoundWithId', {
        args: { id: 'seat-xyz' },
      });
    });
  });
});

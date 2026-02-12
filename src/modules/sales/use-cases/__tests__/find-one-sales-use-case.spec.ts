import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { Repository } from 'typeorm';
import { SaleEntity } from '../../entities';
import { FindOneSalesUseCase } from '../find-one-sales.use-case';

describe('FindOneSalesUseCase', () => {
  let useCase: FindOneSalesUseCase;
  let salesRepository: jest.Mocked<Pick<Repository<SaleEntity>, 'findOneBy'>>;
  let i18nService: jest.Mocked<Pick<I18nService, 't'>>;

  const mockSale: SaleEntity = {
    id: 'sale-1',
    reservationId: 'res-1',
    sessionId: 'session-1',
    seatId: 'seat-1',
    userId: 'user-1',
    amount: 25.5,
    createdAt: new Date(),
  } as SaleEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindOneSalesUseCase,
        {
          provide: getRepositoryToken(SaleEntity),
          useValue: {
            findOneBy: jest.fn(),
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

    useCase = module.get(FindOneSalesUseCase);
    salesRepository = module.get(getRepositoryToken(SaleEntity));
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return sale when found by id', async () => {
      // Arrange
      salesRepository.findOneBy.mockResolvedValue(mockSale);

      // Act
      const result = await useCase.execute({ id: 'sale-1', userId: 'user-1' });

      // Assert
      expect(result).toEqual(mockSale);
      expect(salesRepository.findOneBy).toHaveBeenCalledWith({
        id: 'sale-1',
        userId: 'user-1',
      });
    });

    it('should throw NotFoundException when sale is not found', async () => {
      // Arrange
      salesRepository.findOneBy.mockResolvedValue(null);
      i18nService.t.mockReturnValue('Sale not found');

      // Act & Assert
      await expect(
        useCase.execute({ id: 'non-existent', userId: 'user-1' }),
      ).rejects.toThrow(NotFoundException);

      expect(i18nService.t).toHaveBeenCalledWith('common.sale.notFound', {
        args: { id: 'non-existent' },
      });
    });
  });
});

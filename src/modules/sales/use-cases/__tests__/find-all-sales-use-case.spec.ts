import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { SaleEntity } from '../../entities';
import { FindAllSalesUseCase } from '../find-all-sales.use-case';
import type { IFindAllSalesInput } from '../interfaces';

describe('FindAllSalesUseCase', (): void => {
  let useCase: FindAllSalesUseCase;
  let salesRepository: jest.Mocked<
    Pick<Repository<SaleEntity>, 'findAndCount'>
  >;

  const mockSales: Array<SaleEntity> = [
    {
      id: 'sale-1',
      reservationId: 'res-1',
      sessionId: 'session-1',
      seatId: 'seat-1',
      userId: 'user-1',
      amount: 25.5,
      createdAt: new Date(),
    } as SaleEntity,
  ];

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllSalesUseCase,
        {
          provide: getRepositoryToken(SaleEntity),
          useValue: {
            findAndCount: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(FindAllSalesUseCase);
    salesRepository = module.get(getRepositoryToken(SaleEntity));
  });

  it('should be defined', (): void => {
    expect(useCase).toBeDefined();
  });

  describe('execute', (): void => {
    it('should return sales and total count with pagination', async (): Promise<void> => {
      // Arrange
      salesRepository.findAndCount.mockResolvedValue([mockSales, 1]);

      const input: IFindAllSalesInput = { page: 1, limit: 10 };

      // Act
      const result: [Array<SaleEntity>, number] = await useCase.execute(input);

      // Assert
      expect(result).toEqual([mockSales, 1]);
      expect(salesRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        take: 10,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by userId when provided', async () => {
      // Arrange
      salesRepository.findAndCount.mockResolvedValue([[], 0]);

      const input: IFindAllSalesInput = {
        page: 1,
        limit: 10,
        userId: 'user-123',
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(salesRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        take: 10,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
    });
  });
});

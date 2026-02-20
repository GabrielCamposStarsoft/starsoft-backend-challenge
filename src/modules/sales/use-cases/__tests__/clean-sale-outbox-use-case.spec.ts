import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { DeleteResult, Repository } from 'typeorm';
import { SaleOutboxEntity } from '../../entities';
import { CleanSaleOutboxUseCase } from '../clean-sale-outbox.use-case';

describe('CleanSaleOutboxUseCase', (): void => {
  let useCase: CleanSaleOutboxUseCase;
  let salesOutboxRepository: jest.Mocked<
    Pick<Repository<SaleOutboxEntity>, 'delete'>
  >;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanSaleOutboxUseCase,
        {
          provide: getRepositoryToken(SaleOutboxEntity),
          useValue: {
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(CleanSaleOutboxUseCase);
    salesOutboxRepository = module.get(getRepositoryToken(SaleOutboxEntity));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should delete processed entries older than retention period and return count', async () => {
      // Arrange
      salesOutboxRepository.delete.mockResolvedValue({
        affected: 3,
      } as DeleteResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(3);
      expect(salesOutboxRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          processed: true,
        }),
      );
    });

    it('should return 0 when no entries were deleted', async () => {
      // Arrange
      salesOutboxRepository.delete.mockResolvedValue({
        affected: 0,
      } as DeleteResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when affected is undefined', async () => {
      // Arrange
      salesOutboxRepository.delete.mockResolvedValue({
        affected: undefined,
      } as DeleteResult);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(0);
    });

    it('should pass a createdAt LessThan filter to the delete call', async () => {
      // Arrange
      salesOutboxRepository.delete.mockResolvedValue({
        affected: 1,
      } as DeleteResult);

      // Act
      await useCase.execute();

      // Assert
      const callArg = salesOutboxRepository.delete.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(callArg).toHaveProperty('createdAt');
      expect(callArg).toHaveProperty('processed', true);
    });
  });
});

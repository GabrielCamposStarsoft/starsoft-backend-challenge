import { CreateSalesUseCase } from './create-sales.use-case';
import { FindAllSalesUseCase } from './find-all-sales.use-case';
import { FindOneSalesUseCase } from './find-one-sales.use-case';
import { UpdateSalesUseCase } from './update-sales.use-case';
import { DeleteSalesUseCase } from './delete-sales.use-case';

export const SalesUseCases = [
  CreateSalesUseCase,
  FindAllSalesUseCase,
  FindOneSalesUseCase,
  UpdateSalesUseCase,
  DeleteSalesUseCase,
];

export * from './create-sales.use-case';
export * from './find-all-sales.use-case';
export * from './find-one-sales.use-case';
export * from './update-sales.use-case';
export * from './delete-sales.use-case';

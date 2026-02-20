import { CleanSaleOutboxUseCase } from './clean-sale-outbox.use-case';
import { CreateSalesUseCase } from './create-sales.use-case';
import { FindAllSalesUseCase } from './find-all-sales.use-case';
import { FindOneSalesUseCase } from './find-one-sales.use-case';
import { RelaySaleOutboxUseCase } from './relay-sale-outbox.use-case';

export const SalesUseCases = [
  CleanSaleOutboxUseCase,
  CreateSalesUseCase,
  FindAllSalesUseCase,
  FindOneSalesUseCase,
  RelaySaleOutboxUseCase,
];

export * from './clean-sale-outbox.use-case';
export * from './create-sales.use-case';
export * from './find-all-sales.use-case';
export * from './find-one-sales.use-case';
export * from './relay-sale-outbox.use-case';

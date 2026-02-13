import { CreateSeatsUseCase } from './create-seats.use-case';
import { CreateSeatsBatchUseCase } from './create-seats-batch.use-case';
import { UpdateSeatsUseCase } from './update-seats.use-case';

export const SeatsUseCases = [
  CreateSeatsUseCase,
  CreateSeatsBatchUseCase,
  UpdateSeatsUseCase,
];

export * from './create-seats.use-case';
export * from './create-seats-batch.use-case';
export * from './update-seats.use-case';

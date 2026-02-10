import { CreateSeatsUseCase } from './create-seats.use-case';
import { FindAllSeatsUseCase } from './find-all-seats.use-case';
import { FindOneSeatsUseCase } from './find-one-seats.use-case';
import { UpdateSeatsUseCase } from './update-seats.use-case';
import { DeleteSeatsUseCase } from './delete-seats.use-case';

export const SeatsUseCases = [
  CreateSeatsUseCase,
  FindAllSeatsUseCase,
  FindOneSeatsUseCase,
  UpdateSeatsUseCase,
  DeleteSeatsUseCase,
];

export * from './create-seats.use-case';
export * from './find-all-seats.use-case';
export * from './find-one-seats.use-case';
export * from './update-seats.use-case';
export * from './delete-seats.use-case';

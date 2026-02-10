export * from './register-auth.use-case';
export * from './validate-user.use-case';
export * from './sign-access-token.use-case';
export * from './create-refresh-token.use-case';
export * from './validate-refresh-token.use-case';
export * from './invalidate-refresh-token.use-case';
export * from './get-user-by-id.use-case';

import { RegisterAuthUseCase } from './register-auth.use-case';
import { ValidateUserUseCase } from './validate-user.use-case';
import { SignAccessTokenUseCase } from './sign-access-token.use-case';
import { CreateRefreshTokenUseCase } from './create-refresh-token.use-case';
import { ValidateRefreshTokenUseCase } from './validate-refresh-token.use-case';
import { InvalidateRefreshTokenUseCase } from './invalidate-refresh-token.use-case';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';

export const AuthUseCases = [
  RegisterAuthUseCase,
  ValidateUserUseCase,
  SignAccessTokenUseCase,
  CreateRefreshTokenUseCase,
  ValidateRefreshTokenUseCase,
  InvalidateRefreshTokenUseCase,
  GetUserByIdUseCase,
];

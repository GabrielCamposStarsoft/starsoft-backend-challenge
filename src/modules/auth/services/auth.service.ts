import { Injectable, Logger } from '@nestjs/common';
import type { Nullable } from 'src/common';
import { UserEntity } from '../../users/entities';
import type { UsersResponseDto } from '../../users/dto';
import type { ILoginResponse, IRefreshResponse } from '../interfaces';
import type { RegisterDto, LoginDto } from '../dtos';
import { RegisterAuthUseCase } from '../use-cases/register-auth.use-case';
import { ValidateUserUseCase } from '../use-cases/validate-user.use-case';
import { SignAccessTokenUseCase } from '../use-cases/sign-access-token.use-case';
import { CreateRefreshTokenUseCase } from '../use-cases/create-refresh-token.use-case';
import { ValidateRefreshTokenUseCase } from '../use-cases/validate-refresh-token.use-case';
import { InvalidateRefreshTokenUseCase } from '../use-cases/invalidate-refresh-token.use-case';
import { GetUserByIdUseCase } from '../use-cases/get-user-by-id.use-case';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly registerAuthUseCase: RegisterAuthUseCase,
    private readonly validateUserUseCase: ValidateUserUseCase,
    private readonly signAccessTokenUseCase: SignAccessTokenUseCase,
    private readonly createRefreshTokenUseCase: CreateRefreshTokenUseCase,
    private readonly validateRefreshTokenUseCase: ValidateRefreshTokenUseCase,
    private readonly invalidateRefreshTokenUseCase: InvalidateRefreshTokenUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  public async getUserById(id: string): Promise<Nullable<UserEntity>> {
    return this.getUserByIdUseCase.execute(id);
  }

  public async register(dto: RegisterDto): Promise<UsersResponseDto> {
    return this.registerAuthUseCase.execute(dto);
  }

  public async validateUser(
    email: string,
    password: string,
  ): Promise<UserEntity> {
    return this.validateUserUseCase.execute({ email, password });
  }

  public async login(dto: LoginDto): Promise<ILoginResponse> {
    const user = await this.validateUserUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
    const { accessToken, expiresIn } =
      await this.signAccessTokenUseCase.execute(user);
    const refreshToken = await this.createRefreshTokenUseCase.execute(user);
    this.logger.log(`User logged in: ${user.id} (${user.email})`);
    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  public async validateRefreshToken(
    refreshTokenValue: string,
  ): Promise<UserEntity> {
    return this.validateRefreshTokenUseCase.execute(refreshTokenValue);
  }

  public async refresh(refreshTokenValue: string): Promise<IRefreshResponse> {
    const user: UserEntity =
      await this.validateRefreshTokenUseCase.execute(refreshTokenValue);
    return this.signAccessTokenUseCase.execute(user);
  }

  public async logout(refreshTokenValue: string): Promise<void> {
    await this.invalidateRefreshTokenUseCase.execute(refreshTokenValue);
  }

  public getRequestUser(user: UserEntity): { id: string; email: string } {
    return { id: user.id, email: user.email };
  }
}

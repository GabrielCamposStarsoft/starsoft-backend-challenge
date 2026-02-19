/**
 * @fileoverview Authentication service.
 *
 * Orchestrates use cases for registration, login, refresh, logout, and user validation.
 * Delegates token creation/invalidation and credential checking to use cases.
 *
 * @service auth-service
 */

import { Injectable, Logger } from '@nestjs/common';
import type { IRequestUser, Nullable } from 'src/common';
import type { UserEntity } from '../../users/entities';
import type { LoginDto, RegisterDto } from '../dtos';
import type { ILoginResponse, IRefreshResponse } from '../interfaces';
import {
  CreateRefreshTokenUseCase,
  GetUserByIdUseCase,
  InvalidateRefreshTokenUseCase,
  RegisterAuthUseCase,
  SignAccessTokenUseCase,
  ValidateRefreshTokenUseCase,
  ValidateUserUseCase,
} from '../use-cases';
import type { ISignAccessTokenResponse } from '../interfaces';
import { UsersResponseDto } from 'src/modules/users/dto';
/**
 * Orchestrates authentication and authorization operations.
 *
 * @description Composes use cases for each operation. Does not perform
 * low-level DB or crypto; delegates to dedicated use cases.
 */
@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  /**
   * AuthService constructor.
   */
  constructor(
    private readonly registerAuthUseCase: RegisterAuthUseCase,
    private readonly validateUserUseCase: ValidateUserUseCase,
    private readonly signAccessTokenUseCase: SignAccessTokenUseCase,
    private readonly createRefreshTokenUseCase: CreateRefreshTokenUseCase,
    private readonly validateRefreshTokenUseCase: ValidateRefreshTokenUseCase,
    private readonly invalidateRefreshTokenUseCase: InvalidateRefreshTokenUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  /**
   * Finds a user by their ID.
   * @param id The ID of the user to query.
   * @returns The UserEntity if found, otherwise null.
   */
  public async getUserById(id: string): Promise<Nullable<UserEntity>> {
    return this.getUserByIdUseCase.execute({ id });
  }

  /**
   * Registers a new user and returns tokens (same format as login).
   * @param dto Registration data transfer object.
   * @returns ILoginResponse with accessToken, refreshToken, and expiresIn.
   */
  public async register(dto: RegisterDto): Promise<ILoginResponse> {
    const user: UsersResponseDto = await this.registerAuthUseCase.execute(dto);
    const { accessToken, expiresIn }: ISignAccessTokenResponse =
      this.signAccessTokenUseCase.execute({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    const refreshToken: string = await this.createRefreshTokenUseCase.execute({
      userId: user.id,
    });
    this.logger.log(
      `User registered and logged in: ${user.id} (${user.email})`,
    );
    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Validates a user's credentials.
   * @param email The user's email.
   * @param password The user's password.
   * @returns The authenticated UserEntity, or throws if invalid.
   */
  public async validateUser(
    email: string,
    password: string,
  ): Promise<UserEntity> {
    return this.validateUserUseCase.execute({ email, password });
  }

  /**
   * Authenticates a user and returns login tokens.
   * @param dto Login data transfer object.
   * @returns An object containing accessToken, refreshToken, and expiresIn.
   */
  public async login(dto: LoginDto): Promise<ILoginResponse> {
    const user: UserEntity = await this.validateUserUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
    const { accessToken, expiresIn }: ISignAccessTokenResponse =
      this.signAccessTokenUseCase.execute({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    const refreshToken: string = await this.createRefreshTokenUseCase.execute({
      userId: user.id,
    });
    this.logger.log(`User logged in: ${user.id} (${user.email})`);
    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Validates the given refresh token.
   * @param refreshTokenValue The string value of the refresh token.
   * @returns The UserEntity associated with the valid refresh token.
   */
  public async validateRefreshToken(
    refreshTokenValue: string,
  ): Promise<UserEntity> {
    return this.validateRefreshTokenUseCase.execute(refreshTokenValue);
  }

  /**
   * Issues a new access token using a valid refresh token.
   * @param refreshTokenValue The refresh token.
   * @returns An IRefreshResponse object containing a new access token.
   */
  public async refresh(refreshTokenValue: string): Promise<IRefreshResponse> {
    const user: UserEntity =
      await this.validateRefreshTokenUseCase.execute(refreshTokenValue);
    return this.signAccessTokenUseCase.execute({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }

  /**
   * Invalidates the provided refresh token, effectively logging the user out.
   * @param refreshTokenValue The refresh token to invalidate.
   * @returns void
   */
  public async logout(refreshTokenValue: string): Promise<void> {
    await this.invalidateRefreshTokenUseCase.execute({
      refreshTokenValue,
    });
  }

  /**
   * Extracts a minimal user identity to place on the request.
   * @param user The UserEntity.
   * @returns An object containing user's id and email.
   */
  public getRequestUser(user: UserEntity): IRequestUser {
    return { id: user.id, email: user.email, role: user.role };
  }
}

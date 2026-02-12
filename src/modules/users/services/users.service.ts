/**
 * @fileoverview User domain service.
 *
 * Delegate for user creation and lookup by email. Used by auth module.
 *
 * @service users-service
 */

import { Injectable } from '@nestjs/common';
import { CreateUsersDto, UsersResponseDto } from '../dto';
import { UserEntity } from '../entities';
import { FindUserByEmailUseCase, CreateUsersUseCase } from '../use-cases';
import type { Nullable } from 'src/common';

/**
 * Handles user creation and lookup.
 *
 * @description Delegates to use cases. No direct repository access.
 */
@Injectable()
export class UsersService {
  /**
   * Constructs the UsersService.
   * @param createUsersUseCase Use-case for creating new users.
   * @param findUserByEmailUseCase Use-case for finding a user by email.
   */
  constructor(
    private readonly createUsersUseCase: CreateUsersUseCase,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
  ) {}

  /**
   * Finds and returns a user entity by email.
   * @param email The email address of the user to search for.
   * @returns A user entity if found, otherwise null.
   */
  public async findByEmail(email: string): Promise<Nullable<UserEntity>> {
    return this.findUserByEmailUseCase.execute({ email });
  }

  /**
   * Creates a new user with the provided data transfer object.
   * @param createDto The DTO containing user creation data.
   * @returns A UsersResponseDto with the created user's information.
   */
  public async create(createDto: CreateUsersDto): Promise<UsersResponseDto> {
    const user: UserEntity = await this.createUsersUseCase.execute({
      username: createDto.username,
      email: createDto.email,
      password: createDto.password,
      role: createDto.role,
    });

    return this.toResponseDto(user);
  }

  /**
   * Maps a UserEntity to its corresponding UsersResponseDto.
   * @param user The user entity to convert.
   * @returns The users response DTO.
   */
  private toResponseDto(user: UserEntity): UsersResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

/**
 * @fileoverview Use case for retrieving a user entity by its unique identifier.
 *
 * @usecase get-user-by-id-use-case
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IUseCase, Nullable } from 'src/common';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities';
import type { IGetUserByIdInput } from './interfaces';

/**
 * @class GetUserByIdUseCase
 * @implements IUseCase<IGetUserByIdInput, Nullable<UserEntity>>
 * @description
 * Use case for retrieving a user entity by its unique identifier.
 */
@Injectable()
export class GetUserByIdUseCase implements IUseCase<
  IGetUserByIdInput,
  Nullable<UserEntity>
> {
  /**
   * @constructor
   * @param {Repository<UserEntity>} userRepository - The repository used to access user entities.
   */
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Finds a user by their unique ID.
   * @param {IGetUserByIdInput} input - The input object containing the user's unique ID.
   * @returns {Promise<Nullable<UserEntity>>} The user entity if found, otherwise null.
   */
  public async execute(
    input: IGetUserByIdInput,
  ): Promise<Nullable<UserEntity>> {
    return this.userRepository.findOne({ where: { id: input.id } });
  }
}

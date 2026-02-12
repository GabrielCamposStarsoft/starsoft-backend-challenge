/**
 * @fileoverview Use case for finding a user by email address.
 *
 * @usecase find-user-by-email-use-case
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IUseCase, Nullable } from 'src/common';
import { UserEntity } from '../entities';
import type { IFindByEmailInput } from './interfaces';

/**
 * Use-case for finding a user by their email address.
 */
@Injectable()
export class FindUserByEmailUseCase implements IUseCase<
  IFindByEmailInput,
  Nullable<UserEntity>
> {
  /**
   * Constructs the FindUserByEmailUseCase with required dependencies.
   * @param usersRepository The repository for UserEntity.
   */
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  /**
   * Executes the find user by email operation.
   * @param input - Object containing the email address to search for.
   * @returns The UserEntity if found, otherwise null.
   */
  public async execute(
    input: IFindByEmailInput,
  ): Promise<Nullable<UserEntity>> {
    return this.usersRepository.findOne({ where: { email: input.email } });
  }
}

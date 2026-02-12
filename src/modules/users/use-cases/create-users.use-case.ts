/**
 * @fileoverview Use case for creating a new user.
 *
 * Handles duplicate email check, password hashing, and persistence.
 *
 * @usecase create-users-use-case
 */
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase, Nullable } from 'src/common';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities';
import type { ICreateUsersInput } from './interfaces';

/**
 * Use-case for creating a new user.
 * Handles checking for duplicate email, hashing password, persisting the user, and logging.
 */
@Injectable()
export class CreateUsersUseCase implements IUseCase<
  ICreateUsersInput,
  UserEntity
> {
  /** Logger instance specific to CreateUsersUseCase */
  private readonly logger: Logger = new Logger(CreateUsersUseCase.name);

  /**
   * Constructs a CreateUsersUseCase with required dependencies.
   * @param usersRepository The repository for UserEntity.
   * @param i18n The internationalization (i18n) service for messaging.
   */
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Executes the creation of a new user.
   * Checks for duplicate email, hashes the password, saves the user entity, and logs creation.
   * @param createDto Data for user creation, including username, email, password, and optional role.
   * @returns The persisted UserEntity instance.
   * @throws {ConflictException} If a user with the given email already exists.
   */
  public async execute(input: ICreateUsersInput): Promise<UserEntity> {
    const existing: Nullable<UserEntity> = await this.usersRepository.findOne({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException(
        this.i18n.t('common.user.emailExists', {
          args: { email: input.email },
        }),
      );
    }

    const hashedPassword: string = await argon2.hash(input.password);

    const user: UserEntity = this.usersRepository.create({
      username: input.username,
      email: input.email,
      password: hashedPassword,
      ...(input.role != null && { role: input.role }),
    });

    const saved: UserEntity = await this.usersRepository.save(user);

    this.logger.log(`User ${saved.id} created: ${input.username}`);

    return saved;
  }
}

/**
 * @fileoverview Use case for registering a new user.
 *
 * @use-case register-auth
 */
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase } from 'src/common';
import type { Nullable } from 'src/common';
import { UserEntity } from '../../users/entities';
import { UsersService } from '../../users/services/users.service';
import type { CreateUsersDto } from '../../users/dto/create-users.dto';
import type { UsersResponseDto } from '../../users/dto/users-response.dto';
import type { IRegisterAuthInput } from './interfaces';

/**
 * @class RegisterAuthUseCase
 * @implements IUseCase<IRegisterAuthInput, UsersResponseDto>
 * @description
 * Use case responsible for handling new user registration. It verifies email uniqueness,
 * creates a new user entity, and logs the registration.
 */
@Injectable()
export class RegisterAuthUseCase implements IUseCase<
  IRegisterAuthInput,
  UsersResponseDto
> {
  /**
   * @property {Logger}
   * Logger instance for logging user registration events.
   */
  private readonly logger: Logger = new Logger(RegisterAuthUseCase.name);

  /**
   * @constructor
   * @param {UsersService} usersService - Service for user-related operations.
   * @param {I18nService} i18n - Service for internationalization of error messages.
   */
  constructor(
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Registers a new user.
   *
   * Checks if the email is already in use, and if not, creates a new user.
   * If the email already exists, throws a ConflictException with a localized message.
   *
   * @param {IRegisterAuthInput} input - Registration payload with email and password.
   * @returns {Promise<UsersResponseDto>} The created user DTO.
   * @throws {ConflictException} If the email is already registered.
   */
  public async execute(input: IRegisterAuthInput): Promise<UsersResponseDto> {
    const existing: Nullable<UserEntity> = await this.usersService.findByEmail(
      input.email,
    );

    if (existing) {
      throw new ConflictException(
        this.i18n.t('common.user.emailExists', {
          args: { email: input.email },
        }),
      );
    }

    // Generate a username from email prefix, fallback to email if split fails.
    const username: string = input.email.split('@')[0] ?? input.email;
    const createDto: CreateUsersDto = {
      email: input.email,
      username,
      password: input.password,
    };

    // Create the user and log the registration.
    const user: UsersResponseDto = await this.usersService.create(createDto);
    this.logger.log(`User registered: ${user.id} (${input.email})`);
    return user;
  }
}

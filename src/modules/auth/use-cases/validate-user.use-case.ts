/**
 * @fileoverview Use case for validating a user's credentials.
 *
 * @use-case validate-user
 */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase, Nullable } from 'src/common';
import { UserEntity } from '../../users/entities';
import { UsersService } from '../../users/services/users.service';
import type { IValidateUserInput } from './interfaces';

/**
 * @class ValidateUserUseCase
 * @implements IUseCase<IValidateUserInput, UserEntity>
 * @description
 * Use case for validating a user's credentials. Checks if the user exists by email
 * and verifies the provided password using argon2. Throws an UnauthorizedException if
 * credentials are invalid, and logs failed login attempts.
 */
@Injectable()
export class ValidateUserUseCase implements IUseCase<
  IValidateUserInput,
  UserEntity
> {
  /**
   * Logger instance for this use case.
   * @private
   * @type {Logger}
   */
  private readonly logger: Logger = new Logger(ValidateUserUseCase.name);

  /**
   * @constructor
   * @param {UsersService} usersService - Service for user-related operations.
   * @param {I18nService} i18n - Service for internationalization messages.
   */
  constructor(
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Validates user credentials.
   * - Looks up the user by email.
   * - Verifies password using argon2.
   * - Logs and throws UnauthorizedException if credentials are invalid.
   *
   * @param {IValidateUserInput} input - The user's login credentials.
   * @returns {Promise<UserEntity>} The authenticated user entity.
   * @throws {UnauthorizedException} If user is not found or password is invalid.
   */
  public async execute(input: IValidateUserInput): Promise<UserEntity> {
    const user: Nullable<UserEntity> = await this.usersService.findByEmail(
      input.email,
    );

    if (!user) {
      this.logger.warn(`Login failed: no user for email ${input.email}`);
      throw new UnauthorizedException(
        this.i18n.t('common.auth.invalidCredentials'),
      );
    }

    const isValid: boolean = await argon2.verify(user.password, input.password);

    if (!isValid) {
      this.logger.warn(
        `Login failed: invalid password for email ${input.email}`,
      );
      throw new UnauthorizedException(
        this.i18n.t('common.auth.invalidCredentials'),
      );
    }

    return user;
  }
}

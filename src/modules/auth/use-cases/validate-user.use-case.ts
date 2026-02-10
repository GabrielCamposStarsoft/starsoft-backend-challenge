import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { IUseCase } from 'src/common';
import type { Nullable } from 'src/common';
import { UserEntity } from '../../users/entities';
import { UsersService } from '../../users/services/users.service';

export interface IValidateUserInput {
  email: string;
  password: string;
}

@Injectable()
export class ValidateUserUseCase
  implements IUseCase<IValidateUserInput, UserEntity>
{
  private readonly logger = new Logger(ValidateUserUseCase.name);

  constructor(private readonly usersService: UsersService) {}

  public async execute(input: IValidateUserInput): Promise<UserEntity> {
    const user: Nullable<UserEntity> =
      await this.usersService.findByEmail(input.email);

    if (!user) {
      this.logger.warn(`Login failed: no user for email ${input.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await argon2.verify(user.password, input.password);

    if (!isValid) {
      this.logger.warn(
        `Login failed: invalid password for email ${input.email}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase } from 'src/common';
import type { Nullable } from 'src/common';
import { UserEntity } from '../../users/entities';
import { UsersService } from '../../users/services/users.service';
import type { CreateUsersDto } from '../../users/dto/create-users.dto';
import type { UsersResponseDto } from '../../users/dto/users-response.dto';
import type { RegisterDto } from '../dtos/register.dto';

@Injectable()
export class RegisterAuthUseCase implements IUseCase<
  RegisterDto,
  UsersResponseDto
> {
  private readonly logger = new Logger(RegisterAuthUseCase.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  public async execute(dto: RegisterDto): Promise<UsersResponseDto> {
    const existing: Nullable<UserEntity> = await this.usersService.findByEmail(
      dto.email,
    );

    if (existing) {
      throw new ConflictException(
        this.i18n.t('common.user.emailExists', { args: { email: dto.email } }),
      );
    }

    const username = dto.email.split('@')[0] ?? dto.email;
    const createDto: CreateUsersDto = {
      email: dto.email,
      username,
      password: dto.password,
    };

    const user = await this.usersService.create(createDto);
    this.logger.log(`User registered: ${user.id} (${dto.email})`);
    return user;
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UserEntity } from '../entities';
import { Nullable } from 'src/common';

@Injectable()
export class UpdateUsersUseCase {
  private readonly logger: Logger = new Logger(UpdateUsersUseCase.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(
    id: string,
    updateDto: UpdateUsersDto,
  ): Promise<UserEntity> {
    const user: Nullable<UserEntity> = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(
        this.i18n.t('common.user.notFound', { args: { id } }),
      );
    }

    const payload: UpdateUsersDto = { ...updateDto };

    if (payload.password != null && payload.password !== '') {
      payload.password = await argon2.hash(payload.password);
    }

    Object.assign(user, payload);

    const updated: UserEntity = await this.usersRepository.save(user);

    this.logger.log(`User ${id} updated`);

    return updated;
  }
}

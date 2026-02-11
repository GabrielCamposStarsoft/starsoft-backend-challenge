import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities';
import { IUseCase } from 'src/common/interfaces/use-case.interface';

@Injectable()
export class FindUserByIdUseCase implements IUseCase<string, UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(
        this.i18n.t('common.user.notFound', { args: { id } }),
      );
    }
    return user;
  }
}

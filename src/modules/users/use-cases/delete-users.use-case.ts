import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities';

@Injectable()
export class DeleteUsersUseCase {
  private readonly logger: Logger = new Logger(DeleteUsersUseCase.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(
        this.i18n.t('common.user.notFound', { args: { id } }),
      );
    }

    await this.usersRepository.delete({ id });

    this.logger.log(`User ${id} deleted`);
  }
}

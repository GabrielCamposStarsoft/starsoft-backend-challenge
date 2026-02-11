import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities';

@Injectable()
export class DeleteSessionsUseCase {
  private readonly logger: Logger = new Logger(DeleteSessionsUseCase.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(id: string): Promise<void> {
    const session = await this.sessionsRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(
        this.i18n.t('common.session.notFoundWithId', { args: { id } }),
      );
    }

    await this.sessionsRepository.delete({ id });

    this.logger.log(`Session ${id} deleted`);
  }
}

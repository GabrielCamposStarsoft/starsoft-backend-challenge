import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities';
import type { IUseCase, Nullable } from 'src/common';
import type { IFindSessionByIdInput } from './interfaces';

@Injectable()
export class FindSessionByIdUseCase implements IUseCase<
  IFindSessionByIdInput,
  SessionEntity
> {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(input: IFindSessionByIdInput): Promise<SessionEntity> {
    const { id }: IFindSessionByIdInput = input;
    const session: Nullable<SessionEntity> =
      await this.sessionsRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(
        this.i18n.t('common.session.notFoundWithId', { args: { id } }),
      );
    }
    return session;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities';
import { IUseCase } from 'src/common';
import type { IFindAllSessionsInput } from './interfaces';
@Injectable()
export class FindAllSessionsUseCase implements IUseCase<
  IFindAllSessionsInput,
  [Array<SessionEntity>, number]
> {
  private readonly logger: Logger = new Logger(FindAllSessionsUseCase.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
  ) {}

  public async execute(options: {
    page: number;
    limit: number;
  }): Promise<[Array<SessionEntity>, number]> {
    const { page, limit }: IFindAllSessionsInput = options;

    const [items, total]: [Array<SessionEntity>, number] = await Promise.all([
      this.sessionsRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        order: { createdAt: 'DESC' },
      }),
      this.sessionsRepository.count(),
    ]);

    this.logger.log(`Found ${total} sessions (page ${page})`);

    return [items, total];
  }
}

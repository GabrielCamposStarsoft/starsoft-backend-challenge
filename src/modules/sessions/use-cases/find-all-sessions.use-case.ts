import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities';

@Injectable()
export class FindAllSessionsUseCase {
  private readonly logger: Logger = new Logger(FindAllSessionsUseCase.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
  ) {}

  public async execute(options: {
    page: number;
    limit: number;
  }): Promise<[SessionEntity[], number]> {
    const { page, limit } = options;

    const [items, total] = await Promise.all([
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

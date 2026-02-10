import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities';

@Injectable()
export class DeleteSessionsUseCase {
  private readonly logger: Logger = new Logger(DeleteSessionsUseCase.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
  ) {}

  public async execute(id: string): Promise<void> {
    const session = await this.sessionsRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Session ${id} not found`);
    }

    await this.sessionsRepository.delete({ id });

    this.logger.log(`Session ${id} deleted`);
  }
}

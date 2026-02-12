import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { IUseCase } from 'src/common';
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities';
import type { ICreateSessionsInput } from './interfaces';

@Injectable()
export class CreateSessionsUseCase implements IUseCase<
  ICreateSessionsInput,
  SessionEntity
> {
  private readonly logger: Logger = new Logger(CreateSessionsUseCase.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
  ) {}

  public async execute(input: ICreateSessionsInput): Promise<SessionEntity> {
    const session: SessionEntity = this.sessionsRepository.create({
      movieTitle: input.movieTitle,
      roomName: input.roomName,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      ticketPrice: input.ticketPrice,
    });
    const saved: SessionEntity = await this.sessionsRepository.save(session);

    this.logger.log(`Session ${saved.id} created: ${input.movieTitle}`);

    return saved;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { CreateSessionsDto } from '../dto/create-sessions.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities';

@Injectable()
export class CreateSessionsUseCase {
  private readonly logger: Logger = new Logger(CreateSessionsUseCase.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
  ) {}

  public async execute(createDto: CreateSessionsDto): Promise<SessionEntity> {
    const session: SessionEntity = this.sessionsRepository.create({
      movieTitle: createDto.movieTitle,
      roomName: createDto.roomName,
      startTime: new Date(createDto.startTime),
      endTime: new Date(createDto.endTime),
      ticketPrice: createDto.ticketPrice,
    });
    const saved = await this.sessionsRepository.save(session);

    this.logger.log(`Session ${saved.id} created: ${createDto.movieTitle}`);

    return saved;
  }
}

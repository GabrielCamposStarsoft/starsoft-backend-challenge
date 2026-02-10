import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSessionsDto } from '../dto/update-sessions.dto';
import { SessionEntity } from '../entities';
import { SessionStatus } from '../enums';

@Injectable()
export class UpdateSessionsUseCase {
  private readonly logger: Logger = new Logger(UpdateSessionsUseCase.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
  ) {}

  public async execute(
    id: string,
    updateDto: UpdateSessionsDto,
  ): Promise<SessionEntity> {
    const session = await this.sessionsRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Session ${id} not found`);
    }

    if (updateDto.movieTitle) session.movieTitle = updateDto.movieTitle;
    if (updateDto.roomName) session.roomName = updateDto.roomName;
    if (updateDto.startTime)
      session.startTime = new Date(updateDto.startTime);
    if (updateDto.endTime) session.endTime = new Date(updateDto.endTime);
    if (updateDto.ticketPrice !== undefined)
      session.ticketPrice = updateDto.ticketPrice;
    if (updateDto.status) session.status = updateDto.status as SessionStatus;

    const updated = await this.sessionsRepository.save(session);

    this.logger.log(`Session ${id} updated`);

    return updated;
  }
}

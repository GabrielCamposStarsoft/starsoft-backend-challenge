import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
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
    private readonly i18n: I18nService,
  ) {}

  public async execute(
    id: string,
    updateDto: UpdateSessionsDto,
  ): Promise<SessionEntity> {
    const session = await this.sessionsRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(
        this.i18n.t('common.session.notFoundWithId', { args: { id } }),
      );
    }

    if (updateDto.movieTitle != null) session.movieTitle = updateDto.movieTitle;
    if (updateDto.roomName != null) session.roomName = updateDto.roomName;
    if (updateDto.startTime != null)
      session.startTime = new Date(updateDto.startTime);
    if (updateDto.endTime != null)
      session.endTime = new Date(updateDto.endTime);
    if (updateDto.ticketPrice !== undefined)
      session.ticketPrice = updateDto.ticketPrice;
    if (updateDto.status != null)
      session.status = updateDto.status as SessionStatus;

    const updated = await this.sessionsRepository.save(session);

    this.logger.log(`Session ${id} updated`);

    return updated;
  }
}

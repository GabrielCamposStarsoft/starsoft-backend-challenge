import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase } from 'src/common';
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities';
import type { ICreateSessionsInput } from './interfaces';

/**
 * Checks if two time intervals overlap.
 *
 * @param {Date} startA - The start time of the first interval.
 * @param {Date} endA - The end time of the first interval.
 * @param {Date} startB - The start time of the second interval.
 * @param {Date} endB - The end time of the second interval.
 * @returns {boolean} - Returns true if the intervals overlap, false otherwise.
 */
const overlaps = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean => {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
};

@Injectable()
export class CreateSessionsUseCase implements IUseCase<
  ICreateSessionsInput,
  SessionEntity
> {
  private readonly logger: Logger = new Logger(CreateSessionsUseCase.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
    private readonly i18n: I18nService,
  ) {}

  public async execute(input: ICreateSessionsInput): Promise<SessionEntity> {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    const others = await this.sessionsRepository.find({
      where: { roomName: input.roomName },
    });
    const hasConflict = others.some((s) =>
      overlaps(startTime, endTime, s.startTime, s.endTime),
    );
    if (hasConflict) {
      throw new ConflictException(
        this.i18n.t('common.session.roomScheduleConflict', {
          args: { room: input.roomName },
        }),
      );
    }

    const session: SessionEntity = this.sessionsRepository.create({
      movieTitle: input.movieTitle,
      roomName: input.roomName,
      startTime,
      endTime,
      ticketPrice: input.ticketPrice,
    });
    const saved: SessionEntity = await this.sessionsRepository.save(session);

    this.logger.log(`Session ${saved.id} created: ${input.movieTitle}`);

    return saved;
  }
}

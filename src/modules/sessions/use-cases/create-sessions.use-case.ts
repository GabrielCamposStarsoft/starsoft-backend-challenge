import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase } from 'src/common';
import { QueryFailedError, Repository } from 'typeorm';
import { SessionEntity } from '../entities';
import type { ICreateSessionsInput } from './interfaces';

/**
 * Checks if two date intervals overlap.
 *
 * @param {Date} startA - Start of first interval.
 * @param {Date} endA - End of first interval.
 * @param {Date} startB - Start of second interval.
 * @param {Date} endB - End of second interval.
 * @returns {boolean} True if intervals overlap, false otherwise.
 */
const overlaps = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean => {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
};

/**
 * PostgreSQL GIST exclusion constraint violation error code.
 * Used to detect conflicts with room session schedule.
 * @type {string}
 */
const PG_EXCLUSION_VIOLATION: string = '23P01';

/**
 * Handles creation of movie session entities, enforcing no time-overlap for sessions within the same room.
 *
 * @class
 */
@Injectable()
export class CreateSessionsUseCase implements IUseCase<
  ICreateSessionsInput,
  SessionEntity
> {
  /**
   * Logger for session creation operations.
   * @type {Logger}
   */
  private readonly logger: Logger = new Logger(CreateSessionsUseCase.name);

  /**
   * Constructs CreateSessionsUseCase.
   *
   * @param {Repository<SessionEntity>} sessionsRepository - Repository to persist sessions.
   * @param {I18nService} i18n - Internationalization service for error messages.
   */
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Determines whether provided error is a PostgreSQL GIST exclusion constraint violation.
   *
   * @private
   * @param {unknown} err - The error thrown during query.
   * @returns {boolean} True if the error is a GIST exclusion constraint violation.
   */
  private static isExclusionConstraintViolation(err: unknown): boolean {
    const pgErr: unknown =
      err instanceof QueryFailedError ? err.driverError : err;
    return (
      pgErr != null &&
      typeof pgErr === 'object' &&
      'code' in pgErr &&
      (pgErr as { code?: string }).code === PG_EXCLUSION_VIOLATION
    );
  }

  /**
   * Creates a new session, enforcing no overlap in the same room.
   *
   * The process is:
   * 1. Convert input time values to Date.
   * 2. Query for existing sessions in the same room.
   * 3. Check for local memory-time overlap; throw conflict if found.
   * 4. Create & save new session entity.
   * 5. If a DB race occurred (detected by exclusion constraint violation), throw conflict.
   *
   * @param {ICreateSessionsInput} input - The parameters for creating a session.
   * @returns {Promise<SessionEntity>} The created session entity.
   * @throws {ConflictException} When a time-overlap in the same room is detected.
   */
  public async execute(input: ICreateSessionsInput): Promise<SessionEntity> {
    const startTime: Date = new Date(input.startTime);
    const endTime: Date = new Date(input.endTime);

    /** Query all existing sessions in the specified room. */
    const others: Array<SessionEntity> = await this.sessionsRepository.find({
      where: { roomName: input.roomName },
    });

    /**
     * Check for overlap against each found session.
     * Throws immediately if found.
     */
    const hasConflict: boolean = others.some((s: SessionEntity) =>
      overlaps(startTime, endTime, s.startTime, s.endTime),
    );
    if (hasConflict) {
      throw new ConflictException(
        this.i18n.t('common.session.roomScheduleConflict', {
          args: { room: input.roomName },
        }),
      );
    }

    /** Prepare session entity for insertion. */
    const session: SessionEntity = this.sessionsRepository.create({
      movieTitle: input.movieTitle,
      roomName: input.roomName,
      startTime,
      endTime,
      ticketPrice: input.ticketPrice,
    });

    /**
     * Attempt to persist new session. Detects database-level race via error code.
     * @throws {ConflictException} if an exclusion constraint violation occurs
     */
    try {
      const saved: SessionEntity = await this.sessionsRepository.save(session);
      this.logger.log(`Session ${saved.id} created: ${input.movieTitle}`);
      return saved;
    } catch (err) {
      if (CreateSessionsUseCase.isExclusionConstraintViolation(err)) {
        throw new ConflictException(
          this.i18n.t('common.session.roomScheduleConflict', {
            args: { room: input.roomName },
          }),
        );
      }
      throw err;
    }
  }
}

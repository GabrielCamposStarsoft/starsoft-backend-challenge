/**
 * @fileoverview Use case for updating a session.
 *
 * @usecase update-sessions-use-case
 */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase, Nullable } from 'src/common';
import { QueryFailedError, Repository } from 'typeorm';
import { SessionEntity } from '../entities';
import { IUpdateSessionsInput } from './interfaces';

/**
 * PostgreSQL GIST exclusion constraint violation error code.
 * Used to detect scheduling conflicts at the database level.
 * @type {string}
 */
const PG_EXCLUSION_VIOLATION: string = '23P01';

/**
 * Checks if two date intervals overlap.
 *
 * @param {Date} startA - Start time of the first interval (inclusive).
 * @param {Date} endA   - End time of the first interval (exclusive).
 * @param {Date} startB - Start time of the second interval (inclusive).
 * @param {Date} endB   - End time of the second interval (exclusive).
 * @returns {boolean} True if intervals overlap, false otherwise.
 */
export const overlaps = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean => {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
};

/**
 * Handles updating an existing movie session, enforcing no time-overlap for sessions within the same room.
 *
 * @class
 */
@Injectable()
export class UpdateSessionUseCase implements IUseCase<
  IUpdateSessionsInput,
  void
> {
  /**
   * Constructs UpdateSessionUseCase.
   *
   * @param {Repository<SessionEntity>} sessionRepository - Repository to interact with sessions.
   * @param {I18nService} i18n - Internationalization service for error messages.
   */
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Updates an existing session with the provided input.
   *
   * The process is:
   * 1. Retrieve the session by ID.
   * 2. If no session is found, throw NotFoundException.
   * 3. Merge current session values with input overrides for timing and room.
   * 4. Validate that startTime < endTime.
   * 5. Check for any scheduling conflicts with other sessions in the same room.
   * 6. If conflict is found, throw ConflictException with translated message.
   * 7. If there are real changes, build a partial update payload and perform the update.
   * 8. If a DB exclusion/race error occurs, throw ConflictException.
   *
   * @param {IUpdateSessionsInput} input - Update input payload for the session.
   * @throws {NotFoundException} If the target session does not exist.
   * @throws {ConflictException} If time bounds are invalid or a room schedule conflict occurs.
   * @returns {Promise<void>} Resolves when update completes or skips if no properties were changed.
   */
  public async execute(input: IUpdateSessionsInput): Promise<void> {
    const {
      id,
      movieTitle,
      roomName,
      startTime,
      endTime,
      ticketPrice,
    }: IUpdateSessionsInput = input;

    /**
     * Attempt to find the session by ID.
     * @type {Nullable<SessionEntity>}
     */
    const session: Nullable<SessionEntity> =
      await this.sessionRepository.findOne({ where: { id } });

    // Throw 404 if session does not exist.
    if (!session) {
      throw new NotFoundException(
        this.i18n.t('common.session.notFoundWithId', { args: { id } }),
      );
    }

    /**
     * Compute the intended new room, start, and end time.
     * If not provided, use the current session's values.
     */
    const finalRoom: string = roomName ?? session.roomName;
    const finalStart: Date =
      typeof startTime === 'string' ? new Date(startTime) : session.startTime;
    const finalEnd: Date =
      typeof endTime === 'string' ? new Date(endTime) : session.endTime;

    // Validate that new startTime is before new endTime.
    if (finalStart.getTime() >= finalEnd.getTime()) {
      throw new ConflictException('startTime must be before endTime');
    }

    /**
     * Query all other sessions in the target room.
     *
     * @type {Array<SessionEntity>} others
     */
    const others: Array<SessionEntity> = await this.sessionRepository.find({
      where: { roomName: finalRoom },
    });

    /**
     * Check for scheduling conflict:
     * There must be no other session in the same room whose schedule overlaps the intended [finalStart, finalEnd).
     *
     * @type {boolean} hasConflict
     */
    const hasConflict: boolean = others.some(
      /**
       * Returns true if another session (not the current one) overlaps the desired range.
       * @param {SessionEntity} s
       * @returns {boolean}
       */
      (s: SessionEntity): boolean =>
        s.id !== id && overlaps(finalStart, finalEnd, s.startTime, s.endTime),
    );

    if (hasConflict) {
      throw new ConflictException(
        this.i18n.t('common.session.roomScheduleConflict', {
          args: { room: finalRoom },
        }),
      );
    }

    /**
     * Prepare update payload with only the properties to change.
     *
     * @type {Partial<Pick<SessionEntity, 'movieTitle'|'roomName'|'startTime'|'endTime'|'ticketPrice'>>}
     */
    const updatePayload: Partial<
      Pick<
        SessionEntity,
        'movieTitle' | 'roomName' | 'startTime' | 'endTime' | 'ticketPrice'
      >
    > = {};
    if (movieTitle !== undefined)
      updatePayload.movieTitle = movieTitle ?? undefined;
    if (roomName !== undefined) updatePayload.roomName = roomName ?? undefined;
    if (typeof startTime === 'string')
      updatePayload.startTime = new Date(startTime);
    if (typeof endTime === 'string') updatePayload.endTime = new Date(endTime);
    if (typeof ticketPrice === 'number')
      updatePayload.ticketPrice = ticketPrice;

    /**
     * Only perform the update if at least one property is present in the payload.
     */
    if (Object.keys(updatePayload).length > 0) {
      try {
        await this.sessionRepository.update(id, updatePayload);
      } catch (err) {
        if (UpdateSessionUseCase.isExclusionConstraintViolation(err)) {
          throw new ConflictException(
            this.i18n.t('common.session.roomScheduleConflict', {
              args: { room: finalRoom },
            }),
          );
        }
        throw err;
      }
    }
  }

  /**
   * Determines whether provided error is a PostgreSQL GIST exclusion constraint violation.
   * Used to detect conflicts with room session schedule at the DB level.
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
}

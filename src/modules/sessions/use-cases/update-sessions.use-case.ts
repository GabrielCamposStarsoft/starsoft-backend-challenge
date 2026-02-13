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
import { Repository } from 'typeorm';
import { SessionEntity } from '../entities';
import { IUpdateSessionsInput } from './interfaces';

/**
 * Determines if two time intervals overlap.
 *
 * Returns true if the intervals [startA, endA) and [startB, endB) overlap.
 *
 * @param {Date} startA - Start time of the first interval (inclusive).
 * @param {Date} endA   - End time of the first interval (exclusive).
 * @param {Date} startB - Start time of the second interval (inclusive).
 * @param {Date} endB   - End time of the second interval (exclusive).
 * @returns {boolean} True if the intervals overlap, otherwise false.
 */
export const overlaps = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean => {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
};

@Injectable()
export class UpdateSessionUseCase implements IUseCase<
  IUpdateSessionsInput,
  void
> {
  /**
   * Constructor for UpdateSessionUseCase.
   * @param sessionRepository - TypeORM repository for SessionEntity.
   * @param i18n - I18nService for translations.
   */
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Updates an existing session with new details.
   *
   * - Validates that the session exists.
   * - Ensures the updated startTime is before endTime.
   * - Checks for scheduling conflicts in the same room.
   * - Applies only changed properties.
   *
   * @param {IUpdateSessionsInput} input - Update input payload for the session.
   *
   * @throws {NotFoundException} If the session does not exist.
   * @throws {ConflictException} If startTime is not before endTime or if there is a scheduling conflict in the room.
   *
   * @returns {Promise<void>} Resolves when update is performed or does nothing if no changes are provided.
   */
  public async execute(input: IUpdateSessionsInput): Promise<void> {
    const { id, movieTitle, roomName, startTime, endTime, ticketPrice } = input;

    // Attempt to find the session by ID
    const session: Nullable<SessionEntity> =
      await this.sessionRepository.findOne({ where: { id } });

    // Session does not exist
    if (!session) {
      throw new NotFoundException(
        this.i18n.t('common.session.notFoundWithId', { args: { id } }),
      );
    }

    /**
     * Determine the new room, start, and end time. If not provided in input, fallback to existing session values.
     */
    const finalRoom = roomName ?? session.roomName;
    const finalStart =
      typeof startTime === 'string' ? new Date(startTime) : session.startTime;
    const finalEnd =
      typeof endTime === 'string' ? new Date(endTime) : session.endTime;

    // Validate startTime < endTime
    if (finalStart.getTime() >= finalEnd.getTime()) {
      throw new ConflictException('startTime must be before endTime');
    }

    /**
     * Query for all other sessions in the same room.
     * Check if any schedule overlaps with the new time range.
     */
    const others: Array<SessionEntity> = await this.sessionRepository.find({
      where: { roomName: finalRoom },
    });

    // Detect if schedule conflict exists for the given time range in the room
    const hasConflict: boolean = others.some(
      /**
       * True if another session (not this one) overlaps with the input time
       * @param {SessionEntity} s - Candidate session to compare
       */
      (s) =>
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
     * Prepares the partial update payload with only changed properties.
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
     * If there is at least one property to update, perform the update.
     */
    if (Object.keys(updatePayload).length > 0) {
      await this.sessionRepository.update(id, updatePayload);
    }
  }
}

/**
 * @fileoverview Use case for creating a seat for a given session.
 *
 * @usecase create-seats-use-case
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase } from 'src/common';
import { SessionEntity } from 'src/modules/sessions/entities';
import { Repository } from 'typeorm';
import { SeatEntity } from '../entities';
import type { ICreateSeatsInput } from './interfaces';

/**
 * Use case for creating a seat for a given session.
 * Validates that the session exists before creating the seat. Throws
 * NotFoundException if the session doesn't exist. Logs the creation event.
 *
 * @class CreateSeatsUseCase
 * @implements {IUseCase<ICreateSeatsInput, SeatEntity>}
 */
@Injectable()
export class CreateSeatsUseCase implements IUseCase<
  ICreateSeatsInput,
  SeatEntity
> {
  /**
   * Internal logger instance.
   * @private
   * @readonly
   * @type {Logger}
   */
  private readonly logger: Logger = new Logger(CreateSeatsUseCase.name);

  /**
   * Constructs the use case, injecting repositories and i18n service.
   *
   * @param {Repository<SeatEntity>} seatsRepository - Repository for seat entities.
   * @param {Repository<SessionEntity>} sessionsRepository - Repository for session entities.
   * @param {I18nService} i18n - Service for internationalization.
   */
  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatsRepository: Repository<SeatEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Executes the use case to create a seat associated with a session.
   *
   * Validates that the session exists before creating the seat. Throws
   * NotFoundException if the session doesn't exist. Logs the creation event.
   *
   * @param {ICreateSeatsInput} input - Input data for creating the seat.
   * @returns {Promise<SeatEntity>} The newly created seat entity.
   * @throws {NotFoundException} If the session with the given ID is not found.
   */
  public async execute(input: ICreateSeatsInput): Promise<SeatEntity> {
    const session = await this.sessionsRepository.findOne({
      where: { id: input.sessionId },
    });
    if (!session) {
      throw new NotFoundException(
        this.i18n.t('common.session.notFoundWithId', {
          args: { id: input.sessionId },
        }),
      );
    }

    const seat: SeatEntity = this.seatsRepository.create(input);
    const saved: SeatEntity = await this.seatsRepository.save(seat);

    this.logger.log(
      `Seat ${saved.label} created for session ${input.sessionId}`,
    );

    return saved;
  }
}

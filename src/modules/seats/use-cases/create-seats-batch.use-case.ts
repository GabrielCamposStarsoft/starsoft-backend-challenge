import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase, Nullable } from 'src/common';
import { SessionEntity } from 'src/modules/sessions/entities';
import { SessionStatus } from 'src/modules/sessions/enums';
import { DataSource, EntityManager } from 'typeorm';
import { SeatEntity } from '../entities';
import type { ICreateSeatsBatchInput } from './interfaces';

/**
 * Use case for creating multiple seats in a session as a batch, using a single transaction.
 * - Checks session existence and that it's ACTIVE.
 * - Creates and persists all seats atomically.
 * - Logs batch creation.
 *
 * @class CreateSeatsBatchUseCase
 * @implements {IUseCase<ICreateSeatsBatchInput, Array<SeatEntity>>}
 */
@Injectable()
export class CreateSeatsBatchUseCase implements IUseCase<
  ICreateSeatsBatchInput,
  Array<SeatEntity>
> {
  /**
   * Logger instance for this use case.
   * @private
   * @type {Logger}
   */
  private readonly logger: Logger = new Logger(CreateSeatsBatchUseCase.name);

  /**
   * Create a new CreateSeatsBatchUseCase.
   * @param {DataSource} dataSource - TypeORM data source for transactions.
   * @param {I18nService} i18n - Internationalization (i18n) service.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Executes the transactional batch creation of seats.
   *
   * 1. Validates that the session exists.
   * 2. Ensures the session is ACTIVE.
   * 3. Creates a new SeatEntity for each label.
   * 4. Saves all created seats in a single transaction.
   * 5. Logs the result.
   *
   * @param {ICreateSeatsBatchInput} input - Input containing sessionId and labels.
   * @returns {Promise<SeatEntity[]>} Array of newly created seats.
   * @throws {NotFoundException} If the session does not exist.
   * @throws {BadRequestException} If the session is not ACTIVE.
   */
  public async execute(input: ICreateSeatsBatchInput): Promise<SeatEntity[]> {
    return this.dataSource.transaction(
      /**
       * @param {EntityManager} manager - The transaction manager.
       * @returns {Promise<SeatEntity[]>} Persisted seats.
       */
      async (manager: EntityManager): Promise<SeatEntity[]> => {
        /**
         * Step 1: Validate session existence.
         * @type {Nullable<SessionEntity>}
         */
        const session: Nullable<SessionEntity> = await manager.findOne(
          SessionEntity,
          {
            where: { id: input.sessionId },
          },
        );

        if (!session) {
          throw new NotFoundException(
            this.i18n.t('common.session.notFoundWithId', {
              args: { id: input.sessionId },
            }),
          );
        }

        /**
         * Step 2: Validate session ACTIVE status.
         */
        if (session.status !== SessionStatus.ACTIVE) {
          throw new BadRequestException(
            this.i18n.t('common.session.notActive'),
          );
        }

        /**
         * Step 3: Create seat entities.
         * @type {SeatEntity[]}
         */
        const seats: Array<SeatEntity> = input.labels.map(
          /**
           * Maps each seat label to a new SeatEntity.
           * @param {string} label - The seat label to create.
           * @returns {SeatEntity}
           */
          (label: string): SeatEntity =>
            manager.create(SeatEntity, {
              sessionId: input.sessionId,
              label,
            }),
        );

        /**
         * Step 4: Persist all new seats atomically.
         * @type {SeatEntity[]}
         */
        const saved: Array<SeatEntity> = await manager.save(SeatEntity, seats);

        /**
         * Step 5: Log the batch creation.
         */
        this.logger.log(
          `Batch created ${saved.length} seats for session ${input.sessionId}`,
        );

        return saved;
      },
    );
  }
}

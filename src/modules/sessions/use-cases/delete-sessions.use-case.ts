/**
 * @fileoverview Use case for deleting a session.
 *
 * @usecase delete-sessions-use-case
 */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import type { IUseCase, Nullable } from 'src/common';
import type { Repository } from 'typeorm';
import { SaleEntity } from '../../sales/entities';
import { SessionEntity } from '../entities';
import type { IDeleteSessionsInput } from './interfaces';

/**
 * Use case responsible for deleting a session by its ID.
 * Prevents deletion when the session has confirmed sales.
 */
@Injectable()
export class DeleteSessionUseCase implements IUseCase<
  IDeleteSessionsInput,
  void
> {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Executes the delete operation for a session.
   * @param input - Object containing the session ID to delete.
   * @returns Promise<void> - Resolves when deletion is complete.
   * @throws {NotFoundException} If session is not found.
   * @throws {ConflictException} If session has confirmed sales (cannot delete).
   */
  public async execute(input: IDeleteSessionsInput): Promise<void> {
    const { id }: IDeleteSessionsInput = input;

    const session: Nullable<SessionEntity> =
      await this.sessionRepository.findOne({ where: { id } });

    if (!session) {
      throw new NotFoundException(
        this.i18n.t('common.session.notFoundWithId', { args: { id } }),
      );
    }

    const salesCount = await this.salesRepository.count({
      where: { sessionId: id },
    });
    if (salesCount > 0) {
      throw new ConflictException(
        this.i18n.t('common.session.cannotDeleteWithSales', {
          args: { id, count: salesCount },
        }),
      );
    }

    await this.sessionRepository.delete(id);
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IUseCase } from 'src/common';
import { SeatEntity } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from 'src/modules/sessions/entities';
import { ICreateSeatsInput } from './interfaces';

@Injectable()
export class CreateSeatsUseCase implements IUseCase<
  ICreateSeatsInput,
  SeatEntity
> {
  private readonly logger: Logger = new Logger(CreateSeatsUseCase.name);

  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatsRepository: Repository<SeatEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
    private readonly i18n: I18nService,
  ) {}

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

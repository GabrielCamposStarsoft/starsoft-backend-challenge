import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SeatEntity } from '../entities';
import { SessionEntity } from '../../sessions/entities';
import { SessionStatus } from 'src/modules/sessions/enums';
import { SeatStatus } from '../enums';
import { IDeleteSeatsInput } from './interfaces';

@Injectable()
export class DeleteSeatsUseCase {
  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatsRepository: Repository<SeatEntity>,

    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
  ) {}

  public async execute(input: IDeleteSeatsInput): Promise<void> {
    const { id }: IDeleteSeatsInput = input;

    const seat = await this.seatsRepository.findOne({
      where: { id },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    const session = await this.sessionsRepository.findOne({
      where: { id: seat.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status === SessionStatus.FINISHED) {
      throw new ConflictException('Session is finished');
    }

    if (seat.status === SeatStatus.SOLD) {
      throw new ConflictException('Seat is sold');
    }

    await this.seatsRepository.delete({ id });
  }
}

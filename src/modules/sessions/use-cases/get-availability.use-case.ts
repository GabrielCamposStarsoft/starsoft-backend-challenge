import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import { FindSessionByIdUseCase } from './find-one-sessions.use-case';

const CACHE_TTL_MS = 10_000;

export interface IAvailabilityResponse {
  sessionId: string;
  totalSeats: number;
  availableSeats: number;
  seats: Array<{ id: string; label: string }>;
}

@Injectable()
export class GetAvailabilityUseCase {
  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatRepository: Repository<SeatEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly findSessionByIdUseCase: FindSessionByIdUseCase,
  ) {}

  public async execute(sessionId: string): Promise<IAvailabilityResponse> {
    // Validate that the session exists (throws NotFoundException)
    await this.findSessionByIdUseCase.execute(sessionId);

    const cacheKey: string = `seats:session:${sessionId}`;
    const cached: unknown = await this.cache.get(cacheKey);
    if (cached != null) return cached as IAvailabilityResponse;

    const [seats, totalSeats]: [Array<SeatEntity>, number] =
      await this.seatRepository.findAndCount({
        where: { sessionId },
      });

    const availableSeats: Array<SeatEntity> = seats.filter(
      (s: SeatEntity) => s.status === SeatStatus.AVAILABLE,
    );

    const result: IAvailabilityResponse = {
      sessionId,
      totalSeats,
      availableSeats: availableSeats.length,
      seats: availableSeats.map((s: SeatEntity) => ({
        id: s.id,
        label: s.label,
      })),
    };

    await this.cache.set(cacheKey, result, CACHE_TTL_MS);

    return result;
  }
}

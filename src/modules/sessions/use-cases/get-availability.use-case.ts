import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SeatEntity } from '../../seats/entities';
import { SeatStatus } from '../../seats/enums';
import { FindSessionByIdUseCase } from './find-one-sessions.use-case';
import { Cache } from '@nestjs/cache-manager';
import { IUseCase, Optional } from 'src/common';
import type { IGetAvailabilityInput } from './interfaces';
import type { IAvailabilityResponse } from '../interfaces';
import { CACHE_TTL_MS } from '../constants';

@Injectable()
export class GetAvailabilityUseCase implements IUseCase<
  IGetAvailabilityInput,
  IAvailabilityResponse
> {
  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatRepository: Repository<SeatEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private readonly findSessionByIdUseCase: FindSessionByIdUseCase,
  ) {}

  public async execute(
    input: IGetAvailabilityInput,
  ): Promise<IAvailabilityResponse> {
    // Validate that the session exists (throws NotFoundException)
    await this.findSessionByIdUseCase.execute({ id: input.sessionId });

    const cacheKey: string = `seats:session:${input.sessionId}`;
    const cached: Optional<IAvailabilityResponse> =
      await this.cache.get<IAvailabilityResponse>(cacheKey);
    if (cached) return cached;

    const [availableSeats, availableCount]: [Array<SeatEntity>, number] =
      await this.seatRepository.findAndCount({
        where: { sessionId: input.sessionId, status: SeatStatus.AVAILABLE },
      });

    const totalSeats: number = await this.seatRepository.count({
      where: { sessionId: input.sessionId },
    });

    const result: IAvailabilityResponse = {
      sessionId: input.sessionId,
      totalSeats,
      availableSeats: availableCount,
      seats: availableSeats.map((s: SeatEntity) => ({
        id: s.id,
        label: s.label,
      })),
    };

    await this.cache.set<IAvailabilityResponse>(cacheKey, result, CACHE_TTL_MS);

    return result;
  }
}

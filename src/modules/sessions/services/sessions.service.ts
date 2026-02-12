/**
 * @fileoverview Session domain service.
 *
 * Delegates to use cases for creation, listing, find-by-id, and availability.
 *
 * @service sessions-service
 */

import { Injectable } from '@nestjs/common';
import {
  CreateSessionsUseCase,
  FindAllSessionsUseCase,
  FindSessionByIdUseCase,
  GetAvailabilityUseCase,
} from '../use-cases';
import { CreateSessionsDto, SessionsResponseDto } from '../dto';
import type { SessionEntity } from '../entities';
import type {
  IAvailabilityResponse,
  ISessionsFindAllResponse,
} from '../interfaces';

@Injectable()
export class SessionsService {
  constructor(
    private readonly createSessionsUseCase: CreateSessionsUseCase,
    private readonly findAllSessionsUseCase: FindAllSessionsUseCase,
    private readonly findSessionByIdUseCase: FindSessionByIdUseCase,
    private readonly getAvailabilityUseCase: GetAvailabilityUseCase,
  ) {}

  public async create(
    createDto: CreateSessionsDto,
  ): Promise<SessionsResponseDto> {
    const session: SessionEntity = await this.createSessionsUseCase.execute({
      movieTitle: createDto.movieTitle,
      roomName: createDto.roomName,
      startTime: new Date(createDto.startTime),
      endTime: new Date(createDto.endTime),
      ticketPrice: createDto.ticketPrice,
    });
    return this.toResponseDto(session);
  }

  public async findAll(options: {
    page: number;
    limit: number;
  }): Promise<ISessionsFindAllResponse> {
    const [items, total]: [Array<SessionEntity>, number] =
      await this.findAllSessionsUseCase.execute(options);

    return {
      data: items.map((item: SessionEntity) => this.toResponseDto(item)),
      meta: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  public async findOne(id: string): Promise<SessionsResponseDto> {
    const session: SessionEntity = await this.findSessionByIdUseCase.execute({
      id,
    });
    return this.toResponseDto(session);
  }

  private toResponseDto(session: SessionEntity): SessionsResponseDto {
    return {
      id: session.id,
      movieTitle: session.movieTitle,
      roomName: session.roomName,
      startTime: session.startTime,
      endTime: session.endTime,
      ticketPrice: session.ticketPrice,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  public async getAvailability(id: string): Promise<IAvailabilityResponse> {
    return await this.getAvailabilityUseCase.execute({ sessionId: id });
  }
}

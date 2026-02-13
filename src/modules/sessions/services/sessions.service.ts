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
  GetSeatsUseCase,
  DeleteSessionUseCase,
  UpdateSessionUseCase,
} from '../use-cases';
import {
  CreateSessionsDto,
  DeleteSessionsDto,
  SeatResponseDto,
  SessionsResponseDto,
  UpdateSessionsDto,
} from '../dto';
import type { SessionEntity } from '../entities';
import type { SeatEntity } from '../../seats/entities';
import type {
  IAvailabilityResponse,
  ISessionsFindAllResponse,
} from '../interfaces';

/**
 * Service used to manage movie session domain logic and delegate to use-cases.
 */
@Injectable()
export class SessionsService {
  /**
   * Initializes the SessionsService.
   *
   * @param createSessionsUseCase Use case for creating sessions.
   * @param findAllSessionsUseCase Use case for retrieving all sessions.
   * @param findSessionByIdUseCase Use case for finding a session by ID.
   * @param getAvailabilityUseCase Use case for getting seat availability of a session.
   * @param getSeatsUseCase Use case for fetching seats of a session.
   * @param deleteSessionUseCase Use case for deleting a session.
   * @param updateSessionUseCase Use case for updating a session.
   */
  constructor(
    private readonly createSessionsUseCase: CreateSessionsUseCase,
    private readonly findAllSessionsUseCase: FindAllSessionsUseCase,
    private readonly findSessionByIdUseCase: FindSessionByIdUseCase,
    private readonly getAvailabilityUseCase: GetAvailabilityUseCase,
    private readonly getSeatsUseCase: GetSeatsUseCase,
    private readonly deleteSessionUseCase: DeleteSessionUseCase,
    private readonly updateSessionUseCase: UpdateSessionUseCase,
  ) {}

  /**
   * Creates a new session.
   *
   * @param createDto Data for creating the session.
   * @returns The created session as a SessionsResponseDto.
   */
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

  /**
   * Retrieves a paginated list of all sessions.
   *
   * @param options Pagination options: page and limit.
   * @returns Object containing array of sessions and pagination metadata.
   */
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

  /**
   * Retrieves a single session by its ID.
   *
   * @param id The ID of the session.
   * @returns SessionsResponseDto representing the found session.
   */
  public async findOne(id: string): Promise<SessionsResponseDto> {
    const session: SessionEntity = await this.findSessionByIdUseCase.execute({
      id,
    });
    return this.toResponseDto(session);
  }

  /**
   * Converts a SessionEntity into a SessionsResponseDto.
   *
   * @param session The session entity.
   * @returns The corresponding SessionsResponseDto.
   */
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

  /**
   * Gets seat availability information for a given session.
   *
   * @param id The session ID.
   * @returns Availability information for the session.
   */
  public async getAvailability(id: string): Promise<IAvailabilityResponse> {
    return await this.getAvailabilityUseCase.execute({ sessionId: id });
  }

  /**
   * Retrieves all seats for a specific session.
   *
   * @param id The session ID.
   * @returns Array of SeatResponseDto objects for the session.
   */
  public async getSeats(id: string): Promise<Array<SeatResponseDto>> {
    const seats: Array<SeatEntity> = await this.getSeatsUseCase.execute({
      sessionId: id,
    });
    return seats.map(
      (s: SeatEntity): SeatResponseDto => ({
        id: s.id,
        sessionId: s.sessionId,
        label: s.label,
        status: s.status,
        version: s.version,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }),
    );
  }

  /**
   * Deletes a session by its ID.
   *
   * @param id The ID of the session.
   * @returns Promise resolving when deletion is complete.
   */
  public async delete(deleteDto: DeleteSessionsDto): Promise<void> {
    await this.deleteSessionUseCase.execute({ id: deleteDto.id });
  }

  /**
   * Updates a session by its ID.
   *
   * @param id The ID of the session.
   * @param updateDto Data for updating the session.
   * @returns Promise resolving when update is complete.
   */
  public async update(id: string, updateDto: UpdateSessionsDto): Promise<void> {
    await this.updateSessionUseCase.execute({ id, ...updateDto });
  }
}

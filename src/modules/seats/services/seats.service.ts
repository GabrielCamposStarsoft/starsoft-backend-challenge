/**
 * @fileoverview Seat domain service.
 *
 * Delegates seat creation and status updates to use cases.
 *
 * @service seats-service
 */

import { Injectable } from '@nestjs/common';
import {
  CreateSeatsUseCase,
  CreateSeatsBatchUseCase,
  UpdateSeatsUseCase,
} from '../use-cases';
import {
  CreateSeatsDto,
  CreateSeatsBatchDto,
  SeatsResponseDto,
  UpdateSeatsDto,
} from '../dto';
import { SeatEntity } from '../entities';

/**
 * Service responsible for managing seat-related operations.
 * Delegates operations to corresponding use cases.
 *
 * @class SeatsService
 */
@Injectable()
export class SeatsService {
  /**
   * Initializes the SeatsService.
   * @param {CreateSeatsUseCase} createSeatsUseCase - Use case for creating seats.
   * @param {UpdateSeatsUseCase} updateSeatsUseCase - Use case for updating seat status.
   */
  constructor(
    private readonly createSeatsUseCase: CreateSeatsUseCase,
    private readonly createSeatsBatchUseCase: CreateSeatsBatchUseCase,
    private readonly updateSeatsUseCase: UpdateSeatsUseCase,
  ) {}

  /**
   * Creates a new seat.
   * @param {CreateSeatsDto} createDto - Data transfer object for seat creation.
   * @returns {Promise<SeatsResponseDto>} The created seat as a response DTO.
   */
  public async create(createDto: CreateSeatsDto): Promise<SeatsResponseDto> {
    const seat: SeatEntity = await this.createSeatsUseCase.execute(createDto);
    return this.toResponseDto(seat);
  }

  /**
   * Updates a seat's status (admin only). Allowed: available, blocked, maintenance.
   * @param {string} id - Seat ID.
   * @param {UpdateSeatsDto} updateDto - New status.
   * @returns {Promise<SeatsResponseDto>} The updated seat.
   */
  public async update(
    id: string,
    updateDto: UpdateSeatsDto,
  ): Promise<SeatsResponseDto> {
    const seat: SeatEntity = await this.updateSeatsUseCase.execute({
      id,
      status: updateDto.status,
    });
    return this.toResponseDto(seat);
  }

  /**
   * Creates multiple seats in a single transaction.
   * @param {CreateSeatsBatchDto} dto - Data transfer object for batch seat creation.
   * @returns {Promise<SeatsResponseDto[]>} The created seats as response DTOs.
   */
  public async createBatch(
    dto: CreateSeatsBatchDto,
  ): Promise<Array<SeatsResponseDto>> {
    const seats: Array<SeatEntity> =
      await this.createSeatsBatchUseCase.execute(dto);
    return seats.map(
      (seat: SeatEntity): SeatsResponseDto => this.toResponseDto(seat),
    );
  }

  /**
   * Maps a SeatEntity to a SeatsResponseDto.
   * @private
   * @param {SeatEntity} seat - The seat entity to map.
   * @returns {SeatsResponseDto} The mapped response DTO.
   */
  private toResponseDto(seat: SeatEntity): SeatsResponseDto {
    return {
      id: seat.id,
      sessionId: seat.sessionId,
      label: seat.label,
      status: seat.status,
      version: seat.version,
      createdAt: seat.createdAt,
      updatedAt: seat.updatedAt,
    };
  }
}

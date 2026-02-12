/**
 * @fileoverview Seat domain service.
 *
 * Delegates seat creation to CreateSeatsUseCase.
 *
 * @service seats-service
 */

import { Injectable } from '@nestjs/common';
import { CreateSeatsUseCase } from '../use-cases';
import { CreateSeatsDto, SeatsResponseDto } from '../dto';
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
   */
  constructor(private readonly createSeatsUseCase: CreateSeatsUseCase) {}

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

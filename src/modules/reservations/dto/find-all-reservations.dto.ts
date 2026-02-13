/**
 * @fileoverview Query DTO for listing reservations with pagination and filters.
 *
 * @dto find-all-reservations
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '../enums';
import type { Optional } from 'src/common';

/**
 * Query DTO for listing reservations with optional pagination and filters.
 *
 * @description
 * Used in endpoint GET /reservations. userId is injected by the controller from the JWT.
 *
 * @example
 * ```json
 * { "page": 1, "limit": 10, "sessionId": "...", "status": "pending" }
 * ```
 *
 * @see ReservationsController.findAll
 * @see ReservationsService.findAll
 */
export class FindAllReservationsDto {
  /**
   * Page number (1-based). Default: 1
   *
   * @type {number}
   * @memberof FindAllReservationsDto
   * @example 1
   */
  @ApiPropertyOptional({
    description: 'Page number (1-based). Default: 1',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: Optional<number>;

  /**
   * Number of items per page. Default: 10
   *
   * @type {number}
   * @memberof FindAllReservationsDto
   * @example 10
   */
  @ApiPropertyOptional({
    description: 'Number of items per page. Default: 10',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: Optional<number>;

  /**
   * Filter by user UUID
   *
   * @type {string}
   * @memberof FindAllReservationsDto
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiPropertyOptional({
    description: 'Filter by user UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  userId?: Optional<string>;

  /**
   * Filter by session UUID
   *
   * @type {string}
   * @memberof FindAllReservationsDto
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiPropertyOptional({
    description: 'Filter by session UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  sessionId?: Optional<string>;

  /**
   * Filter by reservation status.
   * Must be one of ReservationStatus values (e.g. "PENDING", "CONFIRMED", etc).
   *
   * @type {ReservationStatus}
   * @memberof FindAllReservationsDto
   * @example ReservationStatus.PENDING
   */
  @ApiPropertyOptional({
    description: 'Filter by reservation status',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  @IsOptional()
  @IsIn(Object.values(ReservationStatus))
  status?: Optional<ReservationStatus>;
}

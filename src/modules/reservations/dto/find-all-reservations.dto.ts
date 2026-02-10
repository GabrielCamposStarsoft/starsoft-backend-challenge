import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReservationStatus } from '../enums';

/**
 * DTO for finding all reservations with optional filters.
 */
export class FindAllReservationsDto {
  /**
   * Page number.
   * @type {number}
   * @example 1
   */
  @ApiProperty({ description: 'Page number', example: 1 })
  @IsNumber()
  @IsOptional()
  page: number;

  /**
   * Number of records per page.
   * @type {number}
   */
  @IsNumber()
  @IsOptional()
  limit: number;

  /**
   * User ID to filter reservations.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  /**
   * Session ID to filter reservations.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  /**
   * Reservation status to filter by.
   * @type {string}
   * @example 'pending'
   */
  @ApiProperty({ description: 'Status', example: 'pending' })
  @IsString()
  @IsIn(Object.values(ReservationStatus))
  status?: ReservationStatus;
}

/**
 * @fileoverview DTO for updating a reservation (e.g. cancellation).
 *
 * @dto update-reservations
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ReservationStatus } from '../enums';
import type { Optional } from 'src/common';

/**
 * DTO for updating a reservation (e.g. cancelling).
 *
 * @description
 * Allows changing the reservation status. Valid transitions: PENDING → CANCELLED.
 * Used in endpoint PATCH /reservations/:id.
 *
 * @example
 * ```json
 * { "status": "cancelled" }
 * ```
 *
 * @see ReservationsController (update - se existir)
 * @see ReservationsService
 */
export class UpdateReservationsDto {
  /**
   * New reservation status (e.g. cancelled to cancel).
   *
   * @example 'cancelled'
   */
  @ApiPropertyOptional({
    description: 'New reservation status',
    enum: ReservationStatus,
    example: ReservationStatus.CANCELLED,
  })
  @IsOptional()
  @IsIn(Object.values(ReservationStatus))
  status?: Optional<ReservationStatus>;
}

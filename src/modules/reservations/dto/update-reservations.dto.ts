/**
 * DTO for updating an existing reservation.
 *
 * Allows for modification of reservation fields, currently limited to status updates.
 *
 * @class UpdateReservationsDto
 * @property {ReservationStatus} [status] - The new status for the reservation (pending, confirmed, expired, cancelled).
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ReservationStatus } from '../enums';
import type { Optional } from 'src/common';

export class UpdateReservationsDto {
  /**
   * The new status to set for the reservation, one of: pending, confirmed, expired, cancelled.
   */
  @ApiPropertyOptional({
    description: 'Reservation status',
    example: ReservationStatus.CANCELLED,
    enum: ReservationStatus,
  })
  @IsOptional()
  @IsIn(Object.values(ReservationStatus))
  status?: Optional<ReservationStatus>;
}

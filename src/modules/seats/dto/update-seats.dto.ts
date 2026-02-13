/**
 * @fileoverview DTO for updating seat status (admin only).
 *
 * @dto update-seats
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { SeatStatus } from '../enums';

const ADMIN_ALLOWED_STATUSES = [
  SeatStatus.AVAILABLE,
  SeatStatus.BLOCKED,
  SeatStatus.MAINTENANCE,
] as const;

/**
 * DTO for updating a seat's status via PATCH /seats/:id.
 * Admin can set AVAILABLE, BLOCKED, or MAINTENANCE.
 * RESERVED and SOLD are managed by the reservation/payment flow.
 */
export class UpdateSeatsDto {
  /**
   * New status for the seat.
   * @example SeatStatus.BLOCKED
   */
  @ApiProperty({
    description:
      'Seat status. Admin may set: available, blocked, maintenance. RESERVED and SOLD are managed by the reservation flow.',
    enum: ADMIN_ALLOWED_STATUSES,
    example: SeatStatus.BLOCKED,
  })
  @IsIn(ADMIN_ALLOWED_STATUSES, {
    message:
      'status must be one of: available, blocked, maintenance. Use reservation flow for reserved/sold.',
  })
  status: (typeof ADMIN_ALLOWED_STATUSES)[number];
}

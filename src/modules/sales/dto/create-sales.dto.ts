/**
 * @fileoverview DTO for confirming payment of a reservation (creating a sale).
 *
 * @dto create-sales
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO for confirming payment of a reservation and creating a sale.
 *
 * @description
 * Contains the reservationId of the reservation to be confirmed. Used in endpoint POST /sales.
 *
 * @example
 * ```json
 * { "reservationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
 * ```
 *
 * @see SalesController.create
 * @see SalesService.create
 */
export class CreateSalesDto {
  /**
   * UUID of the reservation whose payment will be confirmed.
   *
   * @example 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   */
  @ApiProperty({
    description: 'Reservation UUID to confirm payment',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  reservationId: string;
}

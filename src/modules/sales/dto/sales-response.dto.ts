/**
 * @fileoverview Response DTO for a sale.
 *
 * @dto sales-response
 */
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de resposta representando uma venda.
 *
 * @description
 * Returned in GET /sales, GET /sales/:id and POST /sales.
 *
 * @see SalesController
 * @see SalesService
 */
export class SalesResponseDto {
  /**
   * Sale unique identifier
   * @type {string}
   * @example 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   */
  @ApiProperty({
    description: 'Sale unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  id: string;

  /**
   * Reservation UUID that originated this sale
   * @type {string}
   * @example 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   */
  @ApiProperty({
    description: 'Reservation UUID that originated this sale',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  reservationId: string;

  /**
   * Session UUID
   * @type {string}
   * @example 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   */
  @ApiProperty({
    description: 'Session UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  sessionId: string;

  /**
   * Seat UUID
   * @type {string}
   * @example 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   */
  @ApiProperty({
    description: 'Seat UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  seatId: string;

  /**
   * User UUID who made the purchase
   * @type {string}
   * @example 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   */
  @ApiProperty({
    description: 'User UUID who made the purchase',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  userId: string;

  /**
   * Amount paid in BRL
   * @type {number}
   * @example 25.0
   * @minimum 0
   */
  @ApiProperty({
    description: 'Amount paid in BRL',
    example: 25.0,
    minimum: 0,
  })
  amount: number;

  /**
   * Sale creation date (ISO 8601)
   * @type {Date}
   * @example '2026-02-10T14:30:00.000Z'
   */
  @ApiProperty({
    description: 'Sale creation date (ISO 8601)',
    example: '2026-02-10T14:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;
}

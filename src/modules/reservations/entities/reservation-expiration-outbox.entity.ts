/**
 * @fileoverview Reservation expiration outbox entity (TypeORM).
 *
 * Maps to reservation_expiration_outbox table. Outbox for ReservationExpired and SeatReleased events.
 *
 * @entity reservation-expiration-outbox-entity
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Outbox entity for expiration or cancellation events related to reservations,
 * such as ReservationExpired or SeatReleased. Events are recorded using the Transactional Outbox pattern,
 * ensuring reliable event delivery even in case of application crashes following DB commit.
 */
@Entity('reservation_expiration_outbox')
export class ReservationExpirationOutboxEntity {
  /**
   * Unique identifier of the outbox entry.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Unique identifier of the outbox entry',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the reservation that expired or was cancelled.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Reservation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'reservation_id' })
  reservationId: string;

  /**
   * ID of the seat that was released.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Seat ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'seat_id' })
  seatId: string;

  /**
   * ID of the session related to the reservation event.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'session_id' })
  sessionId: string;

  /**
   * Whether the seat was actually updated to AVAILABLE (if true, a SeatReleased event should be published).
   * @type {boolean}
   * @example true
   */
  @ApiProperty({
    description: 'Whether the seat was released to AVAILABLE',
    example: true,
  })
  @Column({ name: 'seat_released', default: true })
  seatReleased: boolean;

  /**
   * Reason the outbox event was created: 'expired' (from system scheduler or API) or 'cancelled' (manual or automatic).
   * @type {'expired' | 'cancelled'}
   * @example 'expired'
   */
  @ApiProperty({
    description: 'Event reason',
    example: 'expired',
    enum: ['expired', 'cancelled'],
  })
  @Column({ type: 'varchar', length: 20, default: 'expired' })
  reason: string;

  /**
   * Whether the event has been published to the message broker.
   * @type {boolean}
   * @example false
   */
  @ApiProperty({
    description: 'Whether the event was published',
    example: false,
  })
  @Column({ default: false })
  published: boolean;

  /**
   * Timestamp when the outbox entry was created.
   * @type {Date}
   * @format date-time
   */
  @ApiProperty({
    description: 'Creation date',
    type: String,
    format: 'date-time',
  })
  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
}

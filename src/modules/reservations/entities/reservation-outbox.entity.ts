/**
 * @fileoverview Reservation outbox entity (TypeORM).
 *
 * Maps to reservation_events_outbox table. Outbox for ReservationCreated events.
 *
 * @entity reservation-outbox-entity
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Outbox for ReservationCreated events.
 * Written in the same transaction as the reservation and relayed later (Transactional Outbox).
 */
@Entity('reservation_events_outbox')
export class ReservationOutboxEntity {
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
   * ID of the created reservation.
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
   * ID of the reserved seat.
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
   * ID of the session.
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
   * ID of the user who made the reservation.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'user_id' })
  userId: string;

  /**
   * Reservation expiration date.
   * @type {Date}
   * @format date-time
   */
  @ApiProperty({
    description: 'Reservation expiration date',
    type: String,
    format: 'date-time',
  })
  @Column({ name: 'expires_at' })
  expiresAt: Date;

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
   * Creation timestamp.
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

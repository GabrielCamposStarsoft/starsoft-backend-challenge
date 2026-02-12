/**
 * @fileoverview Reservation entity (TypeORM).
 *
 * Maps to reservations table. Seat reservation with status and expiration.
 * Concurrency is handled via pessimistic locking in use cases.
 *
 * @entity reservation-entity
 */

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SeatEntity } from '../../seats/entities';
import { SessionEntity } from '../../sessions/entities';
import { UserEntity } from '../../users/entities';
import { ReservationStatus } from '../enums';

/**
 * Entity representing a seat reservation for a session.
 * Tracks reservation status and expiration. Concurrency via pessimistic locking.
 */
@Entity('reservations')
@Index('idx_reservations_status_expires', ['status', 'expiresAt'])
export class ReservationEntity {
  /**
   * Unique identifier of the reservation.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Unique identifier of the reservation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the session this reservation belongs to.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  /**
   * Session entity associated with this reservation.
   * @type {SessionEntity}
   */
  @ApiProperty({ description: 'Session entity', type: () => SessionEntity })
  @ManyToOne(() => SessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  /**
   * ID of the reserved seat.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Seat ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'seat_id', type: 'uuid' })
  seatId: string;

  /**
   * Seat entity associated with this reservation.
   * @type {SeatEntity}
   */
  @ApiProperty({ description: 'Seat entity', type: () => SeatEntity })
  @ManyToOne(() => SeatEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seat_id' })
  seat: SeatEntity;

  /**
   * ID of the user who made the reservation.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /**
   * User entity who made the reservation.
   * @type {UserEntity}
   */
  @ApiProperty({ description: 'User entity', type: () => UserEntity })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  /**
   * Current status of the reservation (e.g. pending, confirmed, expired, cancelled).
   * @type {ReservationStatus}
   */
  @ApiProperty({ description: 'Reservation status', enum: ReservationStatus })
  @Column({
    type: 'varchar',
    length: 20,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  /**
   * Date and time when the reservation expires if not confirmed.
   * @type {Date}
   * @format date-time
   */
  @ApiProperty({
    description: 'Expiration date of the reservation',
    type: String,
    format: 'date-time',
  })
  @Column({
    type: 'timestamp',
    name: 'expires_at',
  })
  expiresAt: Date;

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

  /**
   * Last update timestamp.
   * @type {Date}
   * @format date-time
   */
  @ApiProperty({
    description: 'Last update date',
    type: String,
    format: 'date-time',
  })
  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
  })
  updatedAt: Date;
}

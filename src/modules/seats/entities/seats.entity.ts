/**
 * @fileoverview Seat entity (TypeORM).
 *
 * Represents a seat within a session, identified by a label (e.g., "A1") and status.
 * Implements optimistic locking with a version column.
 *
 * @entity seat-entity
 */

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  VersionColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SessionEntity } from '../../sessions/entities';
import { SeatStatus } from '../enums';

/**
 * Represents a seat in a session.
 * Each seat has a unique label and status (available, reserved, sold).
 */
@Entity('seats')
@Index('idx_seats_session_label', ['sessionId', 'label'], { unique: true })
export class SeatEntity {
  /**
   * Unique identifier of the seat.
   * @type {string}
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'Unique identifier of the seat',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the session this seat belongs to.
   * @type {string}
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'Session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  /**
   * Session entity relation.
   * @type {SessionEntity}
   */
  @ApiProperty({ description: 'Session entity', type: () => SessionEntity })
  @ManyToOne(() => SessionEntity, (session: SessionEntity) => session.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  /**
   * Seat label within the session.
   * Unique per session (e.g., "A1", "A2").
   * @type {string}
   * @example "A1"
   */
  @ApiProperty({ description: 'Seat label (e.g. A1, A2)', example: 'A1' })
  @Column({ type: 'varchar', length: 10 })
  label: string;

  /**
   * Current status of the seat.
   * One of: "available", "reserved", or "sold".
   * @type {SeatStatus}
   */
  @ApiProperty({ description: 'Seat status', enum: SeatStatus })
  @Column({
    type: 'varchar',
    length: 20,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  /**
   * Entity version for optimistic locking.
   * @type {number}
   * @default 0
   */
  @ApiProperty({
    description: 'Entity version for optimistic locking',
    example: 0,
  })
  @VersionColumn({ type: 'int', default: 0 })
  version: number;

  /**
   * Creation timestamp of the seat entity.
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
   * Last update timestamp of the seat entity.
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

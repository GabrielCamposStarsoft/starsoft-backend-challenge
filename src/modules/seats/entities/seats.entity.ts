/**
 * @fileoverview SeatEntity (TypeORM ORM entity).
 * @module entities/SeatEntity
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
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SessionEntity } from '../../sessions/entities';
import { SeatStatus } from '../enums';

/**
 * @class SeatEntity
 * @classdesc Represents a seat in a session, each identified by a unique label and status.
 *
 * @property {string} id - Unique identifier of the seat (UUID).
 * @property {string} sessionId - The session this seat belongs to.
 * @property {SessionEntity} session - The related Session entity instance.
 * @property {string} label - The seat label (unique per session), e.g. "A1".
 * @property {SeatStatus} status - The seat's current status ("available", "reserved", "sold").
 * @property {number} version - Entity version (optimistic locking, default 0).
 * @property {Date} createdAt - Creation timestamp.
 * @property {Date} updatedAt - Last update timestamp.
 */
@Entity('seats')
@Index('idx_seats_session_label', ['sessionId', 'label'], { unique: true })
export class SeatEntity {
  /**
   * Unique identifier of the seat (UUID).
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
   * Seat label within the session. Unique per session (e.g., "A1").
   * @type {string}
   * @example "A1"
   */
  @ApiProperty({ description: 'Seat label (e.g. A1, A2)', example: 'A1' })
  @Column({ type: 'varchar', length: 10 })
  label: string;

  /**
   * Current status of the seat.
   * One of SeatStatus ("available", "reserved", "sold").
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
  @Column({ type: 'int', default: 0 })
  version: number;

  /**
   * Creation timestamp of the seat entity.
   * @type {Date}
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

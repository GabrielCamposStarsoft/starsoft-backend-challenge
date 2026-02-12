/**
 * @fileoverview Session entity (TypeORM).
 *
 * Maps to sessions table. Represents a movie screening with room, time, price.
 *
 * @entity session-entity
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SessionStatus } from '../enums';

/**
 * Entity representing a movie session (screening).
 * Defines room, time window, ticket price and status.
 *
 * @class SessionEntity
 * @implements {SessionEntity}
 */
@Entity('sessions')
export class SessionEntity {
  /**
   * Unique identifier of the session.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Unique identifier of the session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Title of the movie.
   * @type {string}
   * @example 'Inception'
   */
  @ApiProperty({ description: 'Movie title', example: 'Inception' })
  @Column({
    type: 'varchar',
    length: 255,
    name: 'movie_title',
  })
  movieTitle: string;

  /**
   * Name of the room where the session takes place.
   * @type {string}
   * @example 'Room 1'
   */
  @ApiProperty({ description: 'Room name', example: 'Room 1' })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'room_name',
  })
  roomName: string;

  /**
   * Session start date and time.
   * @type {Date}
   * @format date-time
   */
  @ApiProperty({
    description: 'Session start time',
    type: String,
    format: 'date-time',
  })
  @Column({
    type: 'timestamp',
    name: 'start_time',
  })
  startTime: Date;

  /**
   * Session end date and time.
   * @type {Date}
   * @format date-time
   */
  @ApiProperty({
    description: 'Session end time',
    type: String,
    format: 'date-time',
  })
  @Column({
    type: 'timestamp',
    name: 'end_time',
  })
  endTime: Date;

  /**
   * Ticket price for this session.
   * @type {number}
   * @example 25.5
   */
  @ApiProperty({ description: 'Ticket price', example: 25.5 })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'ticket_price',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  ticketPrice: number;

  /**
   * Current status of the session (e.g. active, finished).
   * @type {SessionStatus}
   * @default SessionStatus.ACTIVE
   */
  @ApiProperty({ description: 'Session status', enum: SessionStatus })
  @Column({
    type: 'varchar',
    length: 20,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

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

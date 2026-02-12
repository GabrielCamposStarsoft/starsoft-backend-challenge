/**
 * @fileoverview Sale entity (TypeORM).
 *
 * Maps to sales table. Completed purchase; one per seat per session (unique).
 *
 * @entity sale-entity
 */

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationEntity } from '../../reservations/entities/reservation.entity';
import { SessionEntity } from '../../sessions/entities/session.entity';
import { SeatEntity } from '../../seats/entities/seats.entity';
import { UserEntity } from '../../users/entities/user.entity';

/**
 * Entity representing a completed sale (purchased ticket).
 * One sale per seat per session (unique constraint on seatId + sessionId).
 */
@Entity('sales')
@Index('idx_sales_user_id', ['userId'])
@Unique('uq_sales_seat_session', ['seatId', 'sessionId'])
export class SaleEntity {
  /** Unique identifier of the sale. */
  @ApiProperty({
    description: 'Unique identifier of the sale',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** ID of the reservation that was confirmed by this sale. */
  @ApiProperty({
    description: 'Reservation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'reservation_id', type: 'uuid' })
  reservationId: string;

  /** Reservation entity. */
  @ApiProperty({
    description: 'Reservation entity',
    type: () => ReservationEntity,
  })
  @ManyToOne(() => ReservationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: ReservationEntity;

  /** ID of the session. */
  @ApiProperty({
    description: 'Session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  /** Session entity. */
  @ApiProperty({ description: 'Session entity', type: () => SessionEntity })
  @ManyToOne(() => SessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  /** ID of the sold seat. */
  @ApiProperty({
    description: 'Seat ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'seat_id', type: 'uuid' })
  seatId: string;

  /** Seat entity. */
  @ApiProperty({ description: 'Seat entity', type: () => SeatEntity })
  @ManyToOne(() => SeatEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seat_id' })
  seat: SeatEntity;

  /** ID of the user who purchased. */
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** User entity. */
  @ApiProperty({ description: 'User entity', type: () => UserEntity })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  /** Ticket amount paid. */
  @ApiProperty({ description: 'Sale amount (ticket price)', example: 25.5 })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  /** Creation timestamp. */
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

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

import { SeatEntity } from '../../seats/entities';
import { SessionEntity } from '../../sessions/entities';
import { UserEntity } from '../../users/entities';
import { ReservationStatus } from '../enums';

@Entity('reservations')
@Index('idx_reservations_status_expires', ['status', 'expiresAt'])
export class ReservationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ---------------- SESSION ----------------
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => SessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  // ---------------- SEAT ----------------
  @Column({ name: 'seat_id', type: 'uuid' })
  seatId: string;

  @ManyToOne(() => SeatEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seat_id' })
  seat: SeatEntity;

  // ---------------- USER ----------------
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  // ---------------- STATUS ----------------
  @Column({
    type: 'varchar',
    length: 20,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  // ---------------- EXPIRATION ----------------
  @Column({
    type: 'timestamp',
    name: 'expires_at',
  })
  expiresAt: Date;

  // ---------------- TIMESTAMPS ----------------
  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
  })
  updatedAt: Date;

  @Column({ type: 'int', default: 0 })
  version: number;
}

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  Index,
} from 'typeorm';

import { SessionEntity } from '../../sessions/entities/session.entity';
import { SeatStatus } from '../enums';

@Entity('seats')
@Index('idx_seats_session_label', ['sessionId', 'label'], { unique: true })
export class SeatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // -------- FK SESSION --------
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => SessionEntity, (session: SessionEntity) => session.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  // -------- LABEL --------
  @Column({ type: 'varchar', length: 10 })
  label: string; // "A1", "A2", ...

  // -------- STATUS --------
  @Column({
    type: 'varchar',
    length: 20,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  // -------- OPTIMISTIC LOCK --------
  @VersionColumn({ type: 'int', default: 0 })
  version: number;

  // -------- TIMESTAMPS --------
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
}

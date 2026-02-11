import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('reservation_events_outbox')
export class ReservationOutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reservationId' })
  reservationId: string;

  @Column({ name: 'seatId' })
  seatId: string;

  @Column({ name: 'sessionId' })
  sessionId: string;

  @Column({ name: 'userId' })
  userId: string;

  @Column({ name: 'expiresAt' })
  expiresAt: Date;

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
}

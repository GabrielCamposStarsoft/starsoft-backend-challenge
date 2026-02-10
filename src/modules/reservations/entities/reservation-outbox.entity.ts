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

  @Column()
  reservationId: string;

  @Column()
  seatId: string;

  @Column()
  sessionId: string;

  @Column()
  userId: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * Outbox for expiration events (ReservationExpired, SeatReleased) so they are
 * written in the same transaction as the reservation/seat updates and relayed
 * later, avoiding lost events if the app crashes after commit and before publish.
 */
@Entity('reservation_expiration_outbox')
export class ReservationExpirationOutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reservation_id' })
  reservationId: string;

  @Column({ name: 'seat_id' })
  seatId: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  /** Whether the seat was actually updated to AVAILABLE (publish SeatReleased). */
  @Column({ name: 'seat_released', default: true })
  seatReleased: boolean;

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
}

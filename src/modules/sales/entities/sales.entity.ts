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

import { ReservationEntity } from '../../reservations/entities/reservation.entity';
import { SessionEntity } from '../../sessions/entities/session.entity';
import { SeatEntity } from '../../seats/entities/seats.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('sales')
@Index('idx_sales_user_id', ['userId'])
@Unique('uq_sales_seat_session', ['seatId', 'sessionId']) // Add unique constraint (seat_id, session_id)
export class SaleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // -------- RESERVATION --------
  @Column({ name: 'reservation_id', type: 'uuid' })
  reservationId: string;

  @ManyToOne(() => ReservationEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: ReservationEntity;

  // -------- SESSION --------
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => SessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  // -------- SEAT --------
  @Column({ name: 'seat_id', type: 'uuid' })
  seatId: string;

  @ManyToOne(() => SeatEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seat_id' })
  seat: SeatEntity;

  // -------- USER --------
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  // -------- AMOUNT --------
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

  // -------- CREATED AT --------
  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
}

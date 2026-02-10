import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SessionStatus } from '../enums';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'movie_title',
  })
  movieTitle: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'room_name',
  })
  roomName: string;

  @Column({
    type: 'timestamp',
    name: 'start_time',
  })
  startTime: Date;

  @Column({
    type: 'timestamp',
    name: 'end_time',
  })
  endTime: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'ticket_price',
  })
  ticketPrice: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

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

import { Either } from 'src/common';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  ISeatsReservedPayload,
  IPaymentConfirmedPayload,
} from '../interfaces';

export type OutboxPayload = Either<
  ISeatsReservedPayload,
  IPaymentConfirmedPayload
>;

@Entity('sales_outbox')
export class SaleOutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  event: string;

  @Column('jsonb')
  payload: OutboxPayload;

  @Column({ default: false })
  processed: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
}

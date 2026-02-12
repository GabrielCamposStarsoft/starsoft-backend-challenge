/**
 * @fileoverview Sale outbox entity (TypeORM).
 *
 * Maps to sales_outbox table. Outbox for PaymentConfirmed events.
 *
 * @entity sale-outbox-entity
 */
import { Either } from 'src/common';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import type {
  ISeatsReservedPayload,
  IPaymentConfirmedPayload,
} from '../interfaces';

/**
 * Represents the outbox payload which can be
 * either a seats reserved payload or a payment confirmed payload.
 */
export type OutboxPayload = Either<
  ISeatsReservedPayload,
  IPaymentConfirmedPayload
>;

/**
 * Entity representing the transactional outbox for sale-related domain events.
 * Used to ensure events (such as PaymentConfirmed) are reliably relayed after being
 * written within the same transaction as the sale operation.
 */
@Entity('sales_outbox')
export class SaleOutboxEntity {
  /**
   * Unique identifier of the outbox entry.
   * @type {string}
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @ApiProperty({
    description: 'Unique identifier of the outbox entry',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of the event (e.g. PaymentConfirmed).
   * @type {string}
   * @example 'PaymentConfirmed'
   */
  @ApiProperty({ description: 'Event type', example: 'PaymentConfirmed' })
  @Column()
  event: string;

  /**
   * JSON payload of the event, containing event-specific data.
   * @type {OutboxPayload}
   */
  @ApiProperty({ description: 'Event payload (JSON)' })
  @Column('jsonb')
  payload: OutboxPayload;

  /**
   * Indicates if the event has already been processed and published.
   * @type {boolean}
   * @default false
   * @example false
   */
  @ApiProperty({
    description: 'Whether the event was processed',
    example: false,
  })
  @Column({ default: false })
  processed: boolean;

  /**
   * The timestamp of when this outbox entry was created.
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
}

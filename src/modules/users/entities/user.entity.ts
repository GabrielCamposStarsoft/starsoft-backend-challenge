/**
 * @fileoverview User entity (TypeORM).
 *
 * Maps to users table. Stores username, email, hashed password, role.
 * Used for auth and ownership of reservations/sales.
 *
 * @module user-entity
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common';

/**
 * Entity representing a user (customer) of the system.
 * Used for authentication and ownership of reservations and sales.
 */
@Entity('users')
@Index('idx_users_email_unique', ['email'], { unique: true })
export class UserEntity {
  /** Unique identifier of the user. */
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Display username. */
  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @Column({ type: 'varchar', length: 100 })
  username: string;

  /** User email (unique). Used for login. */
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  /** Hashed password. */
  @ApiProperty({ description: 'Hashed password (never exposed in API)' })
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /** User role for RBAC. */
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Column({ type: 'varchar', length: 20, default: UserRole.USER })
  role: UserRole;

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

  /** Last update timestamp. */
  @ApiProperty({
    description: 'Last update date',
    type: String,
    format: 'date-time',
  })
  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
  })
  updatedAt: Date;
}

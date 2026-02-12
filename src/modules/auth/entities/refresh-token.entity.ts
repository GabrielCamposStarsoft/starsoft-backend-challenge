/**
 * @fileoverview Entity representing a refresh token.
 *
 * @entity refresh-token
 */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entity representing a refresh token.
 * Stores the hashed token, related user, expiry, and creation time.
 */
@Entity('refresh_tokens')
@Index('idx_refresh_tokens_user_id', ['userId'])
@Index('idx_refresh_tokens_token_hash', ['tokenHash'], { unique: true })
export class RefreshTokenEntity {
  /**
   * Unique identifier of the refresh token.
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  @ApiProperty({
    description: 'Unique identifier of the refresh token',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the user to whom this refresh token belongs.
   * @example "c3c34c58-4e73-441f-b2df-3670247e4089"
   */
  @ApiProperty({
    description: 'ID of the user this token belongs to',
    example: 'c3c34c58-4e73-441f-b2df-3670247e4089',
  })
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  /**
   * The user entity associated with this refresh token.
   */
  @ApiProperty({
    description: 'The user this refresh token belongs to',
    type: () => UserEntity,
  })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  /**
   * Hashed value of the refresh token.
   * @example "$2b$10$ZtZON...bM8GXeIx/WpJSK"
   */
  @ApiProperty({
    description: 'Hash of the refresh token (never the raw value)',
    example: '$2b$10$ZtZON...bM8GXeIx/WpJSK',
  })
  @Column({ type: 'varchar', length: 255, name: 'token_hash' })
  tokenHash: string;

  /**
   * Expiry date of the refresh token.
   * @example "2024-09-11T10:00:00.000Z"
   */
  @ApiProperty({
    description: 'Date when the refresh token expires',
    example: '2024-09-11T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  /**
   * Date-time when the refresh token entity was created.
   * @example "2024-06-11T09:43:19.720Z"
   */
  @ApiProperty({
    description: 'Date when the refresh token was created',
    example: '2024-06-11T09:43:19.720Z',
    type: String,
    format: 'date-time',
  })
  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
}

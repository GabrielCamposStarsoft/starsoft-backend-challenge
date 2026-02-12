/**
 * @fileoverview Users module.
 *
 * Manages user CRUD. Provides UsersService for auth and user management.
 * No HTTP controller; users created via auth registration.
 *
 * @module users
 */

import { Module } from '@nestjs/common';
import { UserEntity } from './entities';
import { UsersService } from './services';
import { UsersUseCases } from './use-cases';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UsersService, ...UsersUseCases],
  exports: [UsersService],
})
export class UsersModule {}

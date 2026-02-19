/**
 * @fileoverview User seeder for development data.
 *
 * Inserts 10 users (1 admin, 9 standard users) with hashed password.
 * Password for all: Password1!
 *
 * @seeder user-seeder
 */

import type { DataSource, Repository } from 'typeorm';
import type { Seeder, SeederFactoryManager } from 'typeorm-extension';
import * as argon2 from 'argon2';
import { UserEntity } from '../../modules/users/entities';
import { UserRole } from 'src/common';

/**
 * Seeds the users table with test accounts.
 *
 * @description Creates alice (admin) and bob-jack (users). All share password Password1!
 */
export class UserSeeder1739270400000 implements Seeder {
  /**
   * Inserts seeded users into the database.
   *
   * @param dataSource - TypeORM DataSource
   * @param _factoryManager - Unused factory manager
   */
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const repo: Repository<UserEntity> = dataSource.getRepository(UserEntity);
    const password: string = await argon2.hash('Password1!');

    const users: Array<Pick<UserEntity, 'username' | 'email' | 'role'>> = [
      { username: 'alice', email: 'alice@example.com', role: UserRole.ADMIN },
      { username: 'bob', email: 'bob@example.com', role: UserRole.USER },
      { username: 'carol', email: 'carol@example.com', role: UserRole.USER },
      { username: 'dave', email: 'dave@example.com', role: UserRole.USER },
      { username: 'eve', email: 'eve@example.com', role: UserRole.USER },
      { username: 'frank', email: 'frank@example.com', role: UserRole.USER },
      { username: 'grace', email: 'grace@example.com', role: UserRole.USER },
      { username: 'henry', email: 'henry@example.com', role: UserRole.USER },
      { username: 'iris', email: 'iris@example.com', role: UserRole.USER },
      { username: 'jack', email: 'jack@example.com', role: UserRole.USER },
    ];
    await repo.insert(
      users.map((u: Pick<UserEntity, 'username' | 'email' | 'role'>) => ({
        ...u,
        password,
      })),
    );
  }
}

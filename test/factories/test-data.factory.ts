/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * Test data factories for integration, e2e, and concurrency tests.
 * Produces deterministic, reproducible test entities.
 */
import type { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { UserRole } from 'src/common';

const PASSWORD_HASH: string = 'Password1!';

export interface TestSession {
  id: string;
  movieTitle: string;
  roomName: string;
  startTime: Date;
  endTime: Date;
  ticketPrice: number;
}

export interface TestUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface TestSeat {
  id: string;
  sessionId: string;
  label: string;
  status: string;
}

/**
 * Create a session in the database.
 */
export async function createTestSession(
  ds: DataSource,
  overrides?: Partial<{
    movieTitle: string;
    roomName: string;
    ticketPrice: number;
  }>,
): Promise<TestSession> {
  const now: Date = new Date();
  const startTime: Date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTime: Date = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  const [result] = await ds.query(
    `INSERT INTO sessions (movie_title, room_name, start_time, end_time, ticket_price, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     RETURNING id, movie_title, room_name, start_time, end_time, ticket_price`,
    [
      overrides?.movieTitle ?? 'Test Movie',
      overrides?.roomName ?? 'Room A',
      startTime,
      endTime,
      overrides?.ticketPrice ?? 25.5,
    ],
  );
  return result as TestSession;
}

/**
 * Create a user in the database.
 */
export async function createTestUser(
  ds: DataSource,
  overrides?: Partial<{ email: string; username: string; role: UserRole }>,
): Promise<TestUser> {
  const email: string =
    overrides?.email ??
    `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;

  const username: string = overrides?.username ?? email.split('@')[0];

  const role: UserRole = overrides?.role ?? UserRole.USER;

  const password: string = await argon2.hash(PASSWORD_HASH);

  const [result] = await ds.query(
    `INSERT INTO users (username, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, username, role`,
    [username, email, password, role],
  );
  return result as TestUser;
}

/**
 * Create an admin user.
 */
export async function createTestAdmin(
  ds: DataSource,
  overrides?: Partial<{ email: string; username: string }>,
): Promise<TestUser> {
  return await createTestUser(ds, {
    ...overrides,
    role: UserRole.ADMIN,
  });
}

/**
 * Create seats for a session. Labels A1, A2, ... A{n}.
 */
export async function createTestSeats(
  ds: DataSource,
  sessionId: string,
  count: number = 16,
): Promise<Array<TestSeat>> {
  const seats: Array<TestSeat> = [];
  for (let i = 1; i <= count; i++) {
    const [row] = await ds.query(
      `INSERT INTO seats (session_id, label, status)
       VALUES ($1, $2, 'available')
       RETURNING id, session_id, label, status`,
      [sessionId, `A${i}`],
    );
    seats.push(row as TestSeat);
  }
  return seats;
}

/**
 * Create a full test scenario: session + 16 seats + N users.
 */
export async function createFullTestScenario(
  ds: DataSource,
  options?: {
    seatCount?: number;
    userCount?: number;
    adminCount?: number;
  },
): Promise<{
  session: TestSession;
  seats: Array<TestSeat>;
  users: Array<TestUser>;
  admin: TestUser;
}> {
  const session: TestSession = await createTestSession(ds);
  const seats: Array<TestSeat> = await createTestSeats(
    ds,
    session.id,
    options?.seatCount ?? 16,
  );

  const uniqueId: string = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const admin: TestUser = await createTestAdmin(ds, {
    email: `admin-${uniqueId}@test.com`,
    username: `admin-${uniqueId}`,
  });

  const userCount = options?.userCount ?? 5;
  const users: TestUser[] = [];
  for (let i = 0; i < userCount; i++) {
    users.push(
      await createTestUser(ds, {
        email: `user${i}-${uniqueId}@test.com`,
        username: `user${i}-${uniqueId}`,
      }),
    );
  }

  return { session, seats, users, admin };
}

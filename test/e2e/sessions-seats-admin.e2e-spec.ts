/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * E2E Tests for Sessions and Seats Admin Operations.
 *
 * - PATCH /sessions/:id — update session (movie, room, time, price)
 * - PATCH /seats/:id — update seat status (blocked, maintenance)
 * - DELETE /sessions/:id — blocked (409) when session has confirmed sales
 *
 * REQUIRES: docker compose -f docker/compose.test.yml up -d
 * Run: pnpm test:e2e
 */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from 'src/app.module';
import type { FastifyInstance } from 'fastify';
import {
  runTestMigrations,
  getTestDataSource,
  closeTestDataSource,
} from '../utils/test-db';
import {
  createFullTestScenario,
  type TestSession,
  type TestSeat,
  type TestUser,
} from '../factories/test-data.factory';
import type { DataSource } from 'typeorm';
import { SeatStatus } from 'src/modules/seats/enums';

interface LoginResponse {
  accessToken: string;
}

const PASSWORD = 'Password1!';

describe('E2E Sessions & Seats Admin', () => {
  let app: INestApplication<FastifyInstance>;
  let ds: DataSource;
  let adminToken: string;
  let userToken: string;
  let session: TestSession;
  let seats: TestSeat[];
  let admin: TestUser;
  let user: TestUser;

  beforeAll(async () => {
    ds = await getTestDataSource();
    await runTestMigrations();

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await (app.getHttpAdapter().getInstance() as FastifyInstance).ready();

    const scenario = await createFullTestScenario(ds, { seatCount: 8 });
    session = scenario.session;
    seats = scenario.seats;
    admin = scenario.admin;
    user = scenario.users[0];

    adminToken = await loginApp(app, admin.email, PASSWORD);
    userToken = await loginApp(app, user.email, PASSWORD);
  });

  afterAll(async () => {
    await app.close();
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await ds.query('DELETE FROM sales_outbox');
    await ds.query('DELETE FROM sales');
    await ds.query('DELETE FROM reservation_events_outbox');
    await ds.query('DELETE FROM reservation_expiration_outbox');
    await ds.query('DELETE FROM reservations');
    await ds.query('UPDATE seats SET status = $1, version = 0', [
      SeatStatus.AVAILABLE,
    ]);
  });

  it('should PATCH /sessions/:id — update movie, room, time, price', async () => {
    const newTitle = 'Updated Movie Title';
    const newRoom = 'Sala VIP';
    const newStart = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const newEnd = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();
    const newPrice = 35.5;

    //@ts-expect-error - inject is not typed
    const res = await app.inject({
      method: 'PATCH',
      url: `/sessions/${session.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      payload: {
        movieTitle: newTitle,
        roomName: newRoom,
        startTime: newStart,
        endTime: newEnd,
        ticketPrice: newPrice,
      },
    });

    expect(res.statusCode).toBe(204);

    const [row] = await ds.query(
      `SELECT movie_title, room_name, start_time, end_time, ticket_price FROM sessions WHERE id = $1`,
      [session.id],
    );
    const s = row as {
      movie_title: string;
      room_name: string;
      start_time: Date;
      end_time: Date;
      ticket_price: string;
    };
    expect(s.movie_title).toBe(newTitle);
    expect(s.room_name).toBe(newRoom);
    expect(parseFloat(s.ticket_price)).toBe(newPrice);
  });

  it('should PATCH /seats/:id — set status to blocked', async () => {
    const seatId = seats[0].id;

    //@ts-expect-error - inject is not typed
    const res = await app.inject({
      method: 'PATCH',
      url: `/seats/${seatId}`,
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      payload: { status: SeatStatus.BLOCKED },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { id: string; status: string };
    expect(body.status).toBe(SeatStatus.BLOCKED);

    const [row] = await ds.query('SELECT status FROM seats WHERE id = $1', [
      seatId,
    ]);
    expect((row as { status: string }).status).toBe(SeatStatus.BLOCKED);
  });

  it('should PATCH /seats/:id — set status to maintenance', async () => {
    const seatId = seats[1].id;

    //@ts-expect-error - inject is not typed
    const res = await app.inject({
      method: 'PATCH',
      url: `/seats/${seatId}`,
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      payload: { status: SeatStatus.MAINTENANCE },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string };
    expect(body.status).toBe(SeatStatus.MAINTENANCE);
  });

  it('should reject DELETE /sessions/:id with 409 when session has sales', async () => {
    const seatId = seats[0].id;

    //@ts-expect-error - inject is not typed
    const reserveRes = await app.inject({
      method: 'POST',
      url: '/reservations',
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json',
        'idempotency-key': `e2e-delete-block-${Date.now()}`,
      },
      payload: { sessionId: session.id, seatIds: [seatId] },
    });
    expect(reserveRes.statusCode).toBe(201);
    const reservations = reserveRes.json() as { id: string }[];
    const reservationId = reservations[0].id;

    //@ts-expect-error - inject is not typed
    const confirmRes = await app.inject({
      method: 'POST',
      url: '/sales',
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json',
        'idempotency-key': `e2e-delete-block-confirm-${Date.now()}`,
      },
      payload: { reservationId },
    });
    expect(confirmRes.statusCode).toBe(201);

    //@ts-expect-error - inject is not typed
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/sessions/${session.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(deleteRes.statusCode).toBe(409);
    const sessionStillExists = await ds.query(
      'SELECT id FROM sessions WHERE id = $1',
      [session.id],
    );
    expect(sessionStillExists).toHaveLength(1);
  });
});

async function loginApp(
  app: INestApplication<FastifyInstance>,
  email: string,
  password: string,
): Promise<string> {
  //@ts-expect-error - inject is not typed
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
    headers: { 'content-type': 'application/json' },
  });
  const body = res.json() as LoginResponse;
  return body.accessToken;
}

/**
 * High-Concurrency Test: 100 users, 16 seats.
 *
 * Expected: Successful reservations <= 16. No seat sold twice.
 * No orphan reservations. No inconsistent state.
 *
 * REQUIRES: docker compose -f docker/compose.test.yml up -d
 * Run: pnpm test:concurrency
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
} from '../factories/test-data.factory';
import type { DataSource } from 'typeorm';

interface LoginResponse {
  accessToken: string;
}

describe('Concurrency: 100 users, 16 seats', () => {
  let app: INestApplication<FastifyInstance>;
  let ds: DataSource;
  let session: TestSession;
  let seats: TestSeat[];
  let tokens: string[];

  beforeAll(async () => {
    ds = await getTestDataSource();
    await runTestMigrations();

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    //@ts-expect-error - FastifyInstance is not typed
    app = module.createNestApplication<FastifyInstance>(new FastifyAdapter());
    await app.init();
    await (app.getHttpAdapter().getInstance() as FastifyInstance).ready();

    const scenario = await createFullTestScenario(ds, {
      seatCount: 16,
      userCount: 100,
    });
    session = scenario.session;
    seats = scenario.seats;

    tokens = await Promise.all(
      scenario.users.map((u) => loginApp(app, u.email, 'Password1!')),
    );
  });

  afterAll(async () => {
    await app.close();
    await closeTestDataSource();
  });

  it('should have at most 16 successful reservations, no seat sold twice', async () => {
    const baseKey = `concurrency-100-${Date.now()}`;

    const results = await Promise.all(
      tokens.map((token, i) =>
        (app.getHttpAdapter().getInstance() as FastifyInstance).inject({
          method: 'POST',
          url: '/reservations',
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
            'idempotency-key': `${baseKey}-${i}`,
          },
          payload: {
            sessionId: session.id,
            seatIds: [seats[i % 16].id],
          },
        }),
      ),
    );

    const successCount = results.filter((r) => r.statusCode === 201).length;
    expect(successCount).toBeLessThanOrEqual(16);

    const resRows = await ds.query<{ seat_id: string }[]>(
      'SELECT seat_id FROM reservations WHERE session_id = $1',
      [session.id],
    );
    const rows = Array.isArray(resRows)
      ? resRows
      : ((resRows as { rows?: Array<{ seat_id: string }> })?.rows ?? []);
    const reservedSeats = rows.map((r: { seat_id: string }) => r.seat_id);
    const uniqueSeats = new Set(reservedSeats);
    expect(uniqueSeats.size).toBe(reservedSeats.length);

    const soldResult = await ds.query<{ count: string }[]>(
      `SELECT COUNT(*) as count FROM seats WHERE session_id = $1 AND status IN ('reserved', 'sold')`,
      [session.id],
    );
    const soldRow = Array.isArray(soldResult)
      ? soldResult[0]
      : (soldResult as { rows?: Array<{ count: string }> })?.rows?.[0];
    expect(Number(soldRow?.count ?? 0)).toBeLessThanOrEqual(16);
  });
});

async function loginApp(
  app: INestApplication<FastifyInstance>,
  email: string,
  password: string,
): Promise<string> {
  const res = await (
    app.getHttpAdapter().getInstance() as FastifyInstance
  ).inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
    headers: { 'content-type': 'application/json' },
  });
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const body = res.json() as LoginResponse;
  return body.accessToken;
}

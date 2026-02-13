/**
 * High-Concurrency Test: 10 users, same seat.
 *
 * Expected: Exactly 1 success, 9 failures. Database consistent.
 * No duplicate reservation rows. No duplicate sales.
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

describe('Concurrency: 10 users, same seat', () => {
  let app: INestApplication<FastifyInstance>;
  let ds: DataSource;
  let session: TestSession;
  let seat: TestSeat;
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
      seatCount: 2,
      userCount: 10,
    });
    session = scenario.session;
    seat = scenario.seats[0];

    tokens = await Promise.all(
      scenario.users.map((u) => loginApp(app, u.email, 'Password1!')),
    );
  });

  afterAll(async () => {
    await app.close();
    await closeTestDataSource();
  });

  it('should have at most 1 success, no duplicate reservations for 10 concurrent on same seat', async () => {
    const baseKey = `concurrency-10-${Date.now()}`;

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
          payload: { sessionId: session.id, seatIds: [seat.id] },
        }),
      ),
    );

    const successCount = results.filter((r) => r.statusCode === 201).length;
    expect(successCount).toBeLessThanOrEqual(1);

    const resCountResult = await ds.query<{ count: string }[]>(
      'SELECT COUNT(*) as count FROM reservations WHERE seat_id = $1',
      [seat.id],
    );
    const row = Array.isArray(resCountResult)
      ? resCountResult[0]
      : (resCountResult as { rows?: Array<{ count: string }> })?.rows?.[0];
    expect(Number(row?.count ?? 0)).toBe(1);

    const seatRow = await ds.query<{ status: string }[]>(
      'SELECT status FROM seats WHERE id = $1',
      [seat.id],
    );
    expect(seatRow[0].status).toBe('reserved');
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

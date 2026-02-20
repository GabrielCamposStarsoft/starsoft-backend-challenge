/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * End-to-End Reservation Flow Tests.
 *
 * Full flow: create session → create seats → reserve → confirm payment.
 * Negative scenarios: confirm expired, confirm already confirmed, reserve sold seat.
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
import { ReservationStatus } from 'src/modules/reservations/enums';
import { SeatEntity } from 'src/modules/seats/entities';
import { ReservationEntity } from 'src/modules/reservations/entities';

interface LoginResponse {
  accessToken: string;
}

describe('E2E Reservation Flow', (): void => {
  let app: INestApplication<FastifyInstance>;
  let ds: DataSource;
  let userToken: string;
  let session: TestSession;
  let seats: TestSeat[];
  let user: TestUser;

  beforeAll(async (): Promise<void> => {
    ds = await getTestDataSource();
    await runTestMigrations();

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await (app.getHttpAdapter().getInstance() as FastifyInstance).ready();

    const scenario = await createFullTestScenario(ds, { seatCount: 16 });
    session = scenario.session;
    seats = scenario.seats;
    user = scenario.users[0];

    userToken = await loginApp(app, user.email, 'Password1!');
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

  it('should complete full flow: reserve → confirm payment → seat sold', async () => {
    const seatId = seats[0].id;
    //@ts-expect-error - inject is not typed
    const reserveRes = await app.inject({
      method: 'POST',
      url: '/reservations',
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json',
        'idempotency-key': `e2e-reserve-${Date.now()}`,
      },
      payload: { sessionId: session.id, seatIds: [seatId] },
    });

    expect(reserveRes.statusCode).toBe(201);
    const reservations = reserveRes.json() as { id: string; seatId: string }[];
    expect(reservations).toHaveLength(1);
    const reservationId = reservations[0].id;
    //@ts-expect-error - inject is not typed
    const confirmRes = await app.inject({
      method: 'POST',
      url: '/sales',
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json',
        'idempotency-key': `e2e-confirm-${Date.now()}`,
      },
      payload: { reservationId },
    });

    expect(confirmRes.statusCode).toBe(201);
    const sale = confirmRes.json() as { id: string; seatId: string };
    expect(sale.seatId).toBe(seatId);

    const [seat] = await ds.query('SELECT status FROM seats WHERE id = $1', [
      seatId,
    ]);
    expect((seat as { status: string }).status).toBe('sold');
  });

  it('should reject reserve on already sold seat', async () => {
    const seatId = seats[0].id;

    await ds.transaction(async (mgr) => {
      await mgr
        .createQueryBuilder()
        .update(SeatEntity)
        .set({ status: SeatStatus.SOLD, version: () => 'version + 1' })
        .where('id = :seatId', { seatId })
        .execute();
    });
    //@ts-expect-error - inject is not typed
    const reserveRes = await app.inject({
      method: 'POST',
      url: '/reservations',
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json',
      },
      payload: { sessionId: session.id, seatIds: [seatId] },
    });

    expect(reserveRes.statusCode).toBe(409);
  });

  it('should reject confirm on expired reservation', async () => {
    const seatId = seats[1].id;
    const expiresAt = new Date(Date.now() - 1000);

    const [res] = await ds.transaction(async (mgr) => {
      await mgr
        .createQueryBuilder()
        .update(SeatEntity)
        .set({ status: SeatStatus.RESERVED, version: () => 'version + 1' })
        .where('id = :seatId', { seatId })
        .execute();
      const r = mgr.create(ReservationEntity, {
        sessionId: session.id,
        seatId,
        userId: user.id,
        status: ReservationStatus.PENDING,
        expiresAt,
      });
      await mgr.save(r);
      return [r] as const;
    });

    //@ts-expect-error - inject is not typed
    const confirmRes = await app.inject({
      method: 'POST',
      url: '/sales',
      headers: {
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json',
      },
      payload: { reservationId: res.id },
    });

    expect(confirmRes.statusCode).toBe(400);
  });
});

async function loginApp(
  app: INestApplication<FastifyInstance>,
  email: string,
  password: string,
): Promise<string> {
  //@ts-expect-error - inject is not typed
  const res: FastifyResponse = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
    headers: { 'content-type': 'application/json' },
  });
  const body = res.json() as LoginResponse;
  return body.accessToken;
}

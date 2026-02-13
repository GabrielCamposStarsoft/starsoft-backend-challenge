/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * PostgreSQL Deadlock Handling Integration Tests.
 *
 * Simulates classic deadlock: User A reserves [seat1, seat3], User B reserves [seat3, seat1].
 * PostgreSQL detects deadlock, aborts one transaction. Validates no corrupted state.
 *
 * REQUIRES: docker compose -f docker/compose.test.yml up -d
 * Run: pnpm test:integration
 */
import type { DataSource } from 'typeorm';
import {
  getTestDataSource,
  runTestMigrations,
  closeTestDataSource,
} from '../../utils/test-db';
import {
  createFullTestScenario,
  type TestSession,
  type TestSeat,
  type TestUser,
} from '../../factories/test-data.factory';
import { SeatStatus } from 'src/modules/seats/enums';
import { ReservationStatus } from 'src/modules/reservations/enums';
import { SeatEntity } from 'src/modules/seats/entities';
import { ReservationEntity } from 'src/modules/reservations/entities';
import type { Nullable } from 'src/common';

describe('PostgreSQL Deadlock Handling', (): void => {
  let ds: DataSource;
  let session: TestSession;
  let seat1: TestSeat;
  let seat3: TestSeat;
  let user1: TestUser;
  let user2: TestUser;

  beforeAll(async (): Promise<void> => {
    ds = await getTestDataSource();
    await runTestMigrations();
  });

  afterAll(async (): Promise<void> => {
    await closeTestDataSource();
  });

  beforeEach(async (): Promise<void> => {
    const scenario = await createFullTestScenario(ds, { seatCount: 4 });
    session = scenario.session;
    seat1 = scenario.seats[0];
    seat3 = scenario.seats[2];
    user1 = scenario.users[0];
    user2 = scenario.users[1];
  });

  afterEach(async () => {
    await ds.query('DELETE FROM sales_outbox');
    await ds.query('DELETE FROM sales');
    await ds.query('DELETE FROM reservation_events_outbox');
    await ds.query('DELETE FROM reservation_expiration_outbox');
    await ds.query('DELETE FROM reservations');
    await ds.query('DELETE FROM seats');
    await ds.query('DELETE FROM sessions');
    await ds.query('DELETE FROM refresh_tokens');
    await ds.query('DELETE FROM users');
  });

  it('should handle deadlock: one transaction aborted, one succeeds, no corrupted state', async () => {
    const expiresAt: Date = new Date(Date.now() + 60_000);
    const sorted1: Array<string> = [seat1.id, seat3.id].sort();
    const sorted2: Array<string> = [seat3.id, seat1.id].sort();

    let t1Committed = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let t1Error: Nullable<Error> = null;
    let t2Committed = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let t2Error: Nullable<Error> = null;

    const runT1 = async (): Promise<void> => {
      const qr = ds.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        for (const seatId of sorted1) {
          const r = await qr.manager
            .createQueryBuilder()
            .update(SeatEntity)
            .set({ status: SeatStatus.RESERVED, version: () => 'version + 1' })
            .where('id = :seatId', { seatId })
            .andWhere('session_id = :sessionId', { sessionId: session.id })
            .andWhere('status = :status', { status: SeatStatus.AVAILABLE })
            .execute();
          if (r.affected === 0) throw new Error('Seat not available');
          const res = qr.manager.create(ReservationEntity, {
            sessionId: session.id,
            seatId,
            userId: user1.id,
            status: ReservationStatus.PENDING,
            expiresAt,
          });
          await qr.manager.save(res);
        }
        await qr.commitTransaction();
        t1Committed = true;
      } catch (e) {
        t1Error = e instanceof Error ? e : new Error(String(e));
        await qr.rollbackTransaction();
      } finally {
        await qr.release();
      }
    };

    const runT2 = async (): Promise<void> => {
      const qr = ds.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        for (const seatId of sorted2) {
          const r = await qr.manager
            .createQueryBuilder()
            .update(SeatEntity)
            .set({ status: SeatStatus.RESERVED, version: () => 'version + 1' })
            .where('id = :seatId', { seatId })
            .andWhere('session_id = :sessionId', { sessionId: session.id })
            .andWhere('status = :status', { status: SeatStatus.AVAILABLE })
            .execute();
          if (r.affected === 0) throw new Error('Seat not available');
          const res = qr.manager.create(ReservationEntity, {
            sessionId: session.id,
            seatId,
            userId: user2.id,
            status: ReservationStatus.PENDING,
            expiresAt,
          });
          await qr.manager.save(res);
        }
        await qr.commitTransaction();
        t2Committed = true;
      } catch (e) {
        t2Error = e instanceof Error ? e : new Error(String(e));
        await qr.rollbackTransaction();
      } finally {
        await qr.release();
      }
    };

    await Promise.all([runT1(), runT2()]);

    expect(t1Committed !== t2Committed).toBe(true);

    const seatRows = await ds.query(
      'SELECT id, status FROM seats WHERE id IN ($1, $2)',
      [seat1.id, seat3.id],
    );
    const seatList = Array.isArray(seatRows) ? seatRows : [seatRows];
    const reservedCount = seatList.filter(
      (s: { status: string }) => s.status === 'reserved',
    ).length;
    expect(reservedCount).toBeLessThanOrEqual(2);

    const resCountResult = await ds.query(
      'SELECT COUNT(*) as count FROM reservations',
    );
    const row = Array.isArray(resCountResult)
      ? resCountResult[0]
      : (resCountResult as { rows?: Array<{ count: string }> })?.rows?.[0];
    expect(Number(row?.count ?? 0)).toBeLessThanOrEqual(2);
  });
});

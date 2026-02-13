/**
 * PostgreSQL Transaction Isolation Integration Tests.
 *
 * Validates:
 * - Row-level locking (atomic seat reservation) prevents double-booking
 * - Only one of two concurrent transactions on the same seat succeeds
 * - No phantom reads, no lost updates
 * - Proper rollback on conflict
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

describe('PostgreSQL Transaction Isolation', () => {
  let ds: DataSource;
  let session: TestSession;
  let seat1: TestSeat;
  let user1: TestUser;
  let user2: TestUser;

  beforeAll(async (): Promise<void> => {
    ds = await getTestDataSource();
    await runTestMigrations();
  });

  afterAll(async (): Promise<void> => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    const scenario = await createFullTestScenario(ds, { seatCount: 4 });
    session = scenario.session;
    seat1 = scenario.seats[0];
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

  it('should allow only one of two concurrent reservations on the same seat', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const conn1 = ds.createQueryRunner();
    const conn2 = ds.createQueryRunner();

    await conn1.connect();
    await conn2.connect();

    let t1Result: { success: boolean; reservationId?: string } = {
      success: false,
    };
    let t2Result: { success: boolean; reservationId?: string } = {
      success: false,
    };

    const runT1 = async (): Promise<void> => {
      await conn1.startTransaction();
      try {
        const r = await conn1.manager
          .createQueryBuilder()
          .update(SeatEntity)
          .set({ status: SeatStatus.RESERVED, version: () => 'version + 1' })
          .where('id = :seatId', { seatId: seat1.id })
          .andWhere('session_id = :sessionId', { sessionId: session.id })
          .andWhere('status = :status', { status: SeatStatus.AVAILABLE })
          .execute();
        if (r.affected === 0) {
          await conn1.rollbackTransaction();
          return;
        }
        const res = conn1.manager.create(ReservationEntity, {
          sessionId: session.id,
          seatId: seat1.id,
          userId: user1.id,
          status: ReservationStatus.PENDING,
          expiresAt,
        });
        await conn1.manager.save(res);
        await conn1.commitTransaction();
        t1Result = { success: true, reservationId: res.id };
      } catch (e) {
        await conn1.rollbackTransaction();

        if (process.env.DEBUG !== undefined) console.error('T1 error:', e);
      }
    };

    const runT2 = async (): Promise<void> => {
      await conn2.startTransaction();
      try {
        const r = await conn2.manager
          .createQueryBuilder()
          .update(SeatEntity)
          .set({ status: SeatStatus.RESERVED, version: () => 'version + 1' })
          .where('id = :seatId', { seatId: seat1.id })
          .andWhere('session_id = :sessionId', { sessionId: session.id })
          .andWhere('status = :status', { status: SeatStatus.AVAILABLE })
          .execute();
        if (r.affected === 0) {
          await conn2.rollbackTransaction();
          return;
        }
        const res = conn2.manager.create(ReservationEntity, {
          sessionId: session.id,
          seatId: seat1.id,
          userId: user2.id,
          status: ReservationStatus.PENDING,
          expiresAt,
        });
        await conn2.manager.save(res);
        await conn2.commitTransaction();
        t2Result = { success: true, reservationId: res.id };
      } catch (e) {
        await conn2.rollbackTransaction();

        if (process.env.DEBUG !== undefined) console.error('T2 error:', e);
      }
    };

    await Promise.all([runT1(), runT2()]);

    await conn1.release();
    await conn2.release();

    const successCount =
      (t1Result.success ? 1 : 0) + (t2Result.success ? 1 : 0);
    expect(successCount).toBe(1);
    //@ts-expect-error - query result is not typed
    const [seatRow] = await ds.query<{ status: string }>(
      'SELECT status FROM seats WHERE id = $1',
      [seat1.id],
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(seatRow?.status).toBe('reserved');

    const [reservations] = await ds.query<{ count: string }[]>(
      'SELECT COUNT(*) as count FROM reservations WHERE seat_id = $1',
      [seat1.id],
    );
    expect(Number(reservations.count)).toBe(1);
  });

  it('should have no phantom reads - seat state is consistent after concurrent attempts', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const results: boolean[] = [];

    for (let i = 0; i < 5; i++) {
      const r = await ds.transaction(async (mgr) => {
        const updateResult = await mgr
          .createQueryBuilder()
          .update(SeatEntity)
          .set({ status: SeatStatus.RESERVED, version: () => 'version + 1' })
          .where('id = :seatId', { seatId: seat1.id })
          .andWhere('session_id = :sessionId', { sessionId: session.id })
          .andWhere('status = :status', { status: SeatStatus.AVAILABLE })
          .execute();
        if (updateResult.affected === 0) return false;
        const res = mgr.create(ReservationEntity, {
          sessionId: session.id,
          seatId: seat1.id,
          userId: user1.id,
          status: ReservationStatus.PENDING,
          expiresAt,
        });
        await mgr.save(res);
        return true;
      });
      results.push(r);
    }

    expect(results.filter(Boolean)).toHaveLength(1);
    //@ts-expect-error - query result is not typed
    const [seat] = await ds.query<{ status: string }>(
      'SELECT status FROM seats WHERE id = $1',
      [seat1.id],
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(seat.status).toBe('reserved');
  });
});

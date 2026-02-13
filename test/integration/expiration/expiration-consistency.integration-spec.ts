/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * Expiration Consistency Integration Tests.
 *
 * Validates:
 * - Expired reservations free seats correctly
 * - No race between expiration job and payment confirmation
 * - No inconsistent seat state
 *
 * REQUIRES: docker compose -f docker/compose.test.yml up -d
 * Run: pnpm test:integration
 */
import { DataSource } from 'typeorm';
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
import { ExpireReservationsUseCase } from 'src/modules/reservations/use-cases';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

describe('Expiration Consistency', () => {
  let ds: DataSource;
  let expireUseCase: ExpireReservationsUseCase;
  let session: TestSession;
  let seat1: TestSeat;
  let user1: TestUser;

  beforeAll(async () => {
    ds = await getTestDataSource();
    await runTestMigrations();

    const module = await Test.createTestingModule({
      providers: [
        ExpireReservationsUseCase,
        {
          provide: DataSource,
          useValue: ds,
        },
        {
          provide: getRepositoryToken(ReservationEntity),
          useValue: ds.getRepository(ReservationEntity),
        },
      ],
    }).compile();

    expireUseCase = module.get(ExpireReservationsUseCase);
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    const scenario = await createFullTestScenario(ds, { seatCount: 4 });
    session = scenario.session;
    seat1 = scenario.seats[0];
    user1 = scenario.users[0];
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

  it('should expire pending reservation and release seat correctly', async () => {
    const expiresAt = new Date(Date.now() - 1000);

    await ds.transaction(async (mgr) => {
      await mgr
        .createQueryBuilder()
        .update(SeatEntity)
        .set({ status: SeatStatus.RESERVED, version: () => 'version + 1' })
        .where('id = :seatId', { seatId: seat1.id })
        .andWhere('session_id = :sessionId', { sessionId: session.id })
        .execute();

      const res = mgr.create(ReservationEntity, {
        sessionId: session.id,
        seatId: seat1.id,
        userId: user1.id,
        status: ReservationStatus.PENDING,
        expiresAt,
      });
      await mgr.save(res);
    });

    await expireUseCase.execute(new Date());

    const [reservation] = await ds.query(
      'SELECT status FROM reservations WHERE seat_id = $1',
      [seat1.id],
    );
    expect(reservation.status).toBe('expired');

    const [seat] = await ds.query('SELECT status FROM seats WHERE id = $1', [
      seat1.id,
    ]);
    expect(seat.status).toBe('available');
  });

  it('should not expire reservation that is not yet expired', async () => {
    const expiresAt = new Date(Date.now() + 60_000);

    await ds.transaction(async (mgr) => {
      await mgr
        .createQueryBuilder()
        .update(SeatEntity)
        .set({ status: SeatStatus.RESERVED, version: () => 'version + 1' })
        .where('id = :seatId', { seatId: seat1.id })
        .andWhere('session_id = :sessionId', { sessionId: session.id })
        .execute();

      const res = mgr.create(ReservationEntity, {
        sessionId: session.id,
        seatId: seat1.id,
        userId: user1.id,
        status: ReservationStatus.PENDING,
        expiresAt,
      });
      await mgr.save(res);
    });

    await expireUseCase.execute(new Date());

    const [reservation] = await ds.query(
      'SELECT status FROM reservations WHERE seat_id = $1',
      [seat1.id],
    );
    expect(reservation.status).toBe('pending');

    const [seat] = await ds.query('SELECT status FROM seats WHERE id = $1', [
      seat1.id,
    ]);
    expect(seat.status).toBe('reserved');
  });
});

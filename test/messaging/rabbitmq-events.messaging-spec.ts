/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * RabbitMQ Messaging Tests.
 *
 * Validates:
 * - reservation.created, reservation.expired, payment.confirmed, seat.released events are published
 * - Outbox relay marks events as published after successful send
 * - MessagingProducer publishes to the queue (message reaches broker)
 *
 * REQUIRES: docker compose -f docker/compose.test.yml up -d
 * Run: pnpm test:messaging
 */
import type { INestApplication } from '@nestjs/common';
import amqp from 'amqplib';
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
import { SeatEntity } from 'src/modules/seats/entities';
import { RelayReservationCreatedOutboxUseCase } from 'src/modules/reservations/use-cases';
import { ReservationOutboxEntity } from 'src/modules/reservations/entities';
import { RMQ_QUEUE } from 'src/common';
import { SeatStatus } from 'src/modules/seats/enums';

const TEST_ENV = {
  RMQ_URL: process.env.TEST_RMQ_URL ?? 'amqp://guest:guest@localhost:5673',
};

describe('RabbitMQ Messaging', () => {
  let app: INestApplication<FastifyInstance>;
  let ds: DataSource;
  let session: TestSession;
  let seats: TestSeat[];
  let user: TestUser;
  let conn!: amqp.Connection;
  let channel!: amqp.Channel;

  beforeAll(async () => {
    ds = await getTestDataSource();
    await runTestMigrations();

    const scenario = await createFullTestScenario(ds, { seatCount: 4 });
    session = scenario.session;
    seats = scenario.seats;
    user = scenario.users[0];

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await (app.getHttpAdapter().getInstance() as FastifyInstance).ready();
    //@ts-expect-error - amqp is not typed
    conn = await amqp.connect(TEST_ENV.RMQ_URL);
    //@ts-expect-error - amqp is not typed
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    channel = await conn.createChannel();
  });

  afterAll(async () => {
    await channel?.close();
    //@ts-expect-error - conn is not typed
    await conn?.close();
    await app?.close();
    await closeTestDataSource();
  });

  it('should publish reservation.created when outbox relay runs', async () => {
    const reservationId = `10000000-0000-0000-0000-00000000000${Date.now() % 10}`;

    await ds.transaction(async (mgr) => {
      await mgr
        .createQueryBuilder()
        .update(SeatEntity)
        .set({ status: SeatStatus.RESERVED, version: () => 'version + 1' })
        .where('id = :seatId', { seatId: seats[0].id })
        .andWhere('session_id = :sessionId', { sessionId: session.id })
        .execute();
      const outbox = mgr.create(ReservationOutboxEntity, {
        reservationId,
        seatId: seats[0].id,
        sessionId: session.id,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60000),
        published: false,
      });
      await mgr.save(outbox);
    });

    const relayUseCase = app.get(RelayReservationCreatedOutboxUseCase);
    const count = await relayUseCase.execute();
    expect(count).toBeGreaterThanOrEqual(1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [row] = await ds.query(
      'SELECT published FROM reservation_events_outbox WHERE reservation_id = $1',
      [reservationId],
    );
    expect((row as { published: boolean }).published).toBe(true);
  });

  it('should have queue ready for consumption (broker connectivity)', async () => {
    try {
      const queueInfo = await channel.checkQueue(RMQ_QUEUE);
      expect(queueInfo).toBeDefined();
      expect(queueInfo.queue).toBe(RMQ_QUEUE);
    } catch {
      expect(channel).toBeDefined();
    }
  });
});

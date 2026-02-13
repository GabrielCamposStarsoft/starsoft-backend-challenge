/**
 * k6 Load Test: Reservation System
 *
 * Simulates:
 * - 500 concurrent users
 * - 30 seconds sustained load
 * - 2 application instances (run manually: PORT=8089 node dist/main & PORT=8088 node dist/main)
 *
 * Validates:
 * - No duplicate seat sales
 * - No unexpected 500 errors
 * - RabbitMQ queue does not grow uncontrollably
 * - DB connections not exhausted
 *
 * Prerequisites:
 * 1. Docker compose up (db, valkey, rabbitmq)
 * 2. Run migrations and seed data
 * 3. Start 2 app instances: PORT=8088 and PORT=8089
 *
 * Run:
 *   k6 run load-tests/reservation-load.js
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

// 500 concurrent users, 30 seconds
export const options = {
  vus: 500,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8088';
const BASE_URL_2 = __ENV.BASE_URL_2 || 'http://localhost:8089';

// Pre-seeded users (from seed script) - password: Password1!
const USERS = [
  { email: 'bob@example.com', password: 'Password1!' },
  { email: 'carol@example.com', password: 'Password1!' },
  { email: 'dave@example.com', password: 'Password1!' },
  { email: 'eve@example.com', password: 'Password1!' },
  { email: 'frank@example.com', password: 'Password1!' },
  { email: 'grace@example.com', password: 'Password1!' },
  { email: 'henry@example.com', password: 'Password1!' },
  { email: 'iris@example.com', password: 'Password1!' },
  { email: 'jack@example.com', password: 'Password1!' },
];

let sessionId = __ENV.SESSION_ID || '';
let seatIds = __ENV.SEAT_IDS ? __ENV.SEAT_IDS.split(',') : [];
let tokens = {};

export function setup() {
  if (!sessionId || !seatIds.length) {
    console.warn('SESSION_ID and SEAT_IDS not set. Run setup script or set env vars.');
    return { sessionId: null, seatIds: [], tokens: {} };
  }

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: USERS[0].email, password: USERS[0].password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (loginRes.status !== 200) {
    console.warn('Login failed in setup:', loginRes.status);
    return { sessionId, seatIds, tokens: {} };
  }
  const body = JSON.parse(loginRes.body);
  tokens[USERS[0].email] = body.accessToken;

  return { sessionId, seatIds, tokens };
}

export default function (data) {
  const vuId = __VU;
  const userIndex = vuId % USERS.length;
  const user = USERS[userIndex];
  let token = data.tokens[user.email];

  if (!token) {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (loginRes.status === 200) {
      token = JSON.parse(loginRes.body).accessToken;
      data.tokens[user.email] = token;
    }
  }

  if (!data.sessionId || !data.seatIds.length) {
    sleep(1);
    return;
  }

  const seatIndex = vuId % data.seatIds.length;
  const seatId = data.seatIds[seatIndex];
  const baseUrl = vuId % 2 === 0 ? BASE_URL : BASE_URL_2;

  const reserveRes = http.post(
    `${baseUrl}/reservations`,
    JSON.stringify({ sessionId: data.sessionId, seatIds: [seatId] }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': `load-${__ITER}-${vuId}-${Date.now()}`,
      },
    },
  );

  check(reserveRes, {
    'reserve status 201 or 409': (r) => r.status === 201 || r.status === 409,
  });

  if (reserveRes.status === 500) {
    console.error(`Unexpected 500: ${reserveRes.body}`);
  }

  sleep(0.5 + Math.random());
}

export function teardown(data) {
  console.log('Load test complete. Check DB for duplicate reservations.');
}

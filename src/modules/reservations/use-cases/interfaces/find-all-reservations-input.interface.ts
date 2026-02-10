import type { Optional } from 'src/common';
import type { ReservationStatus } from '../../enums';

export interface IFindAllReservationsInput {
  page?: Optional<number>;
  limit?: Optional<number>;
  userId?: Optional<string>;
  sessionId?: Optional<string>;
  status?: Optional<ReservationStatus>;
}

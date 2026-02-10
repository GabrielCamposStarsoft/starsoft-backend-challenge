import type { ReservationsResponseDto } from '../dto';
import type { IMeta } from 'src/common';

export interface IFindAllReservationsResponse {
  data: Array<ReservationsResponseDto>;
  meta: IMeta;
}

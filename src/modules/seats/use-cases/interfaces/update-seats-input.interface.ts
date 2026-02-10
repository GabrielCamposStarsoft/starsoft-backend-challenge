import type { SeatStatus } from '../../enums';

export interface IUpdateSeatsInput {
  id: string;
  status: SeatStatus;
}

import type { Optional } from 'src/common';

export interface IFindAllSeatsInput {
  page: number;
  limit: number;
  sessionId?: Optional<string>;
}

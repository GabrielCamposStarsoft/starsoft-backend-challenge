import type { Optional } from 'src/common';

export interface IFindAllSalesInput {
  page: number;
  limit: number;
  userId?: Optional<string>;
}

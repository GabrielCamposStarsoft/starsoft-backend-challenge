/**
 * @fileoverview Input interface for finding all sales with pagination and optional user filter.
 *
 * @interface find-all-sales-input
 */
import type { Optional } from 'src/common';
export interface IFindAllSalesInput {
  page: number;
  limit: number;
  userId?: Optional<string>;
}

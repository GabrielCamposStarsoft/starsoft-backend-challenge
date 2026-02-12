/**
 * @fileoverview Interface for the response returned when retrieving a paginated list of sales.
 *
 * @interface find-all-sales-response-interface
 */
import type { IMeta } from 'src/common';
import type { SalesResponseDto } from '../dto';

/**
 * Represents the response returned when retrieving a paginated list of sales.
 *
 * @interface IFindAllSalesResponse
 * @property {Array<SalesResponseDto>} data - The array of sales data returned for the current page.
 * @property {IMeta} meta - Metadata containing pagination details such as page, limit, total, and totalPages.
 */
export interface IFindAllSalesResponse {
  data: Array<SalesResponseDto>;
  meta: IMeta;
}

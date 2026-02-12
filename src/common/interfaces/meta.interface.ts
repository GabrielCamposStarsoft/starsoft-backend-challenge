/**
 * @fileoverview Pagination metadata for list responses.
 *
 * Returned alongside data array in paginated endpoints.
 *
 * @interface meta
 */

/**
 * Pagination metadata for list responses.
 */
export interface IMeta {
  /** Current page index (1-based). */
  page: number;

  /** Items per page (limit). */
  limit: number;

  /** Total count of items across all pages. */
  total: number;

  /** Total number of pages. */
  totalPages: number;
}

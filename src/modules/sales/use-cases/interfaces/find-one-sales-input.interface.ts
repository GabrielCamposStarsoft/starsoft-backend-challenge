/**
 * @fileoverview Input interface for finding a single sale.
 *
 * @interface find-one-sales-input
 * @property {string} id - The unique identifier of the sale to find.
 * @property {string} userId - The identifier of the user requesting the sale (used for authorization).
 */
export interface IFindOneSalesInput {
  id: string;
  userId: string;
}

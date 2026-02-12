import type { ReservationsResponseDto } from '../dto';
import type { IMeta } from 'src/common';

/**
 * Interface representing the response returned when fetching all reservations.
 *
 * @property {Array<ReservationsResponseDto>} data - The array of reservation DTOs.
 * @property {IMeta} meta - Metadata information, such as pagination details.
 */
export interface IFindAllReservationsResponse {
  /** The list of reservations returned. */
  data: Array<ReservationsResponseDto>;
  /** Metadata information (e.g., pagination) about the response. */
  meta: IMeta;
}

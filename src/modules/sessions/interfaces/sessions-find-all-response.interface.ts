import type { IMeta } from 'src/common';
import type { SessionsResponseDto } from '../dto';

export interface ISessionsFindAllResponse {
  data: Array<SessionsResponseDto>;
  meta: IMeta;
}

import type { Result } from './result.type';

export type AsyncResult<T, E> = Promise<Result<T, E>>;

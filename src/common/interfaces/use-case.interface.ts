/**
 * @fileoverview Use case contract for application logic.
 *
 * All domain operations follow this interface: execute(input) => output.
 *
 * @interface use-case
 */

import type { Either } from '../types';

/**
 * Generic use case abstraction.
 *
 * @description Encapsulates single business operation. Input and output
 * are strongly typed. execute can return Promise or synchronous value.
 *
 * @template Input - Type of input data
 * @template Output - Type of result
 */
export interface IUseCase<Input, Output> {
  /**
   * Runs the use case with the given input.
   *
   * @param data - Input for the use case
   * @returns Output or Promise of output
   */
  execute(data: Input): Either<Promise<Output>, Output>;
}

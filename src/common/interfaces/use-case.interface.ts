/**
 * Represents a generic application use case.
 *
 * @template Input - The type of the input data required for the use case.
 * @template Output - The type of the result produced by the use case.
 */
export interface IUseCase<Input, Output> {
  /**
   * Executes the use case logic with the given input data.
   *
   * @param data - The input data for the use case.
   * @returns A promise resolving to the output of the use case.
   */
  execute(data: Input): Promise<Output>;
}

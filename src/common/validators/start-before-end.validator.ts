/**
 * Custom validator to ensure that `startTime` is before `endTime` when both are provided.
 * @validator validators/start-before-end.validator
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import type { Nullable, Optional } from '../types';

/**
 * Constraint class for validating that the `startTime` property is before the `endTime` property.
 * Used by the decorator below to enforce the rule.
 * @class
 * @implements {ValidatorConstraintInterface}
 */
@ValidatorConstraint({ name: 'StartBeforeEnd', async: false })
export class StartBeforeEndConstraint implements ValidatorConstraintInterface {
  /**
   * Validates that `startTime` is strictly before `endTime` when both are present and valid.
   * Returns true if either or both values are missing, or if either is invalid.
   * Returns false if both are valid and `startTime >= endTime`.
   * @param _value The property value (not used, rule operates on object properties).
   * @param args Validation arguments, including the object instance.
   * @returns {boolean} True if valid (or not both values present/valid), false if invalid.
   */
  public validate(_value: unknown, args: ValidationArguments): boolean {
    /** @type {{ startTime?: Optional<string>; endTime?: Optional<string> }} */
    const obj: {
      startTime?: Optional<string>;
      endTime?: Optional<string>;
    } = args.object as {
      startTime?: Optional<string>;
      endTime?: Optional<string>;
    };

    /** @type {Nullable<number>} */
    let start: Nullable<number> = null;
    /** @type {Nullable<number>} */
    let end: Nullable<number> = null;

    // Parse and validate startTime
    if (typeof obj.startTime === 'string' && obj.startTime.trim() !== '') {
      const time: number = new Date(obj.startTime).getTime();
      start = Number.isNaN(time) ? null : time;
    }

    // Parse and validate endTime
    if (typeof obj.endTime === 'string' && obj.endTime.trim() !== '') {
      const time: number = new Date(obj.endTime).getTime();
      end = Number.isNaN(time) ? null : time;
    }

    // If both times are valid, check order
    if (
      start !== null &&
      end !== null &&
      !Number.isNaN(start) &&
      !Number.isNaN(end) &&
      start >= end
    ) {
      return false;
    }
    return true;
  }

  /**
   * Provides the default error message if the validator fails.
   * @returns {string} The error message for failed validation.
   */
  defaultMessage(): string {
    return 'startTime must be before endTime';
  }
}

/**
 * Property decorator to add StartBeforeEnd validation to a model property.
 * Typically placed on either the `startTime` or `endTime` property, but
 * it evaluates both values for the owning object.
 * @param {Optional<ValidationOptions>} validationOptions - Additional validation options to customize error messages/etc.
 * @returns {PropertyDecorator} The decorator function to apply.
 */
export function StartBeforeEnd(
  validationOptions?: Optional<ValidationOptions>,
): PropertyDecorator {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions ?? undefined,
      constraints: [],
      validator: StartBeforeEndConstraint,
    });
  };
}

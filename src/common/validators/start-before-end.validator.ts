/**
 * Custom validator: startTime must be before endTime when both are provided.
 */
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import type { Nullable, Optional } from '../types';

@ValidatorConstraint({ name: 'StartBeforeEnd', async: false })
export class StartBeforeEndConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as {
      startTime?: Optional<string>;
      endTime?: Optional<string>;
    };

    let start: Nullable<number> = null;
    let end: Nullable<number> = null;

    if (typeof obj.startTime === 'string' && obj.startTime.trim() !== '') {
      const time: number = new Date(obj.startTime).getTime();
      start = Number.isNaN(time) ? null : time;
    }

    if (typeof obj.endTime === 'string' && obj.endTime.trim() !== '') {
      const time: number = new Date(obj.endTime).getTime();
      end = Number.isNaN(time) ? null : time;
    }
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

  defaultMessage(): string {
    return 'startTime must be before endTime';
  }
}

export function StartBeforeEnd(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: StartBeforeEndConstraint,
    });
  };
}

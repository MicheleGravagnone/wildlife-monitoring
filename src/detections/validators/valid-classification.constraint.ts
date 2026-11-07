import {
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { ClassificationStatus } from '../../generated/prisma/enums.js';

@ValidatorConstraint({ name: 'validClassification', async: false })
export class ValidClassificationConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const { classificationStatus, speciesLabel, confidence } = args.object as {
      classificationStatus?: unknown;
      speciesLabel?: unknown;
      confidence?: unknown;
    };

    switch (classificationStatus) {
      case ClassificationStatus.IDENTIFIED:
        return (
          typeof speciesLabel === 'string' &&
          speciesLabel.trim().length > 0 &&
          typeof confidence === 'number' &&
          Number.isFinite(confidence) &&
          confidence >= 0 &&
          confidence <= 1
        );
      case ClassificationStatus.UNKNOWN:
      case ClassificationStatus.NO_ANIMAL:
        return speciesLabel === null && confidence === null;
      default:
        return false;
    }
  }

  defaultMessage(): string {
    return (
      'IDENTIFIED requires a nonempty speciesLabel and confidence from 0 to 1; ' +
      'UNKNOWN and NO_ANIMAL require both fields to be null'
    );
  }
}

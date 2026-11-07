import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { detectionInput } from '../../../test/support/fixtures.js';
import { CreateDetectionDto } from './create-detection.dto.js';

function validate(changes: Record<string, unknown> = {}) {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return pipe.transform(
    { ...detectionInput, ...changes },
    { type: 'body', metatype: CreateDetectionDto },
  );
}

describe('CreateDetectionDto classification validation', () => {
  it.each([0, 0.5, 1])(
    'accepts an identified species with confidence %s',
    async (confidence) => {
      const result = await validate({ confidence });
      expect(result.speciesLabel).toBe(detectionInput.speciesLabel);
      expect(result.confidence).toBe(confidence);
    },
  );

  it.each(['UNKNOWN', 'NO_ANIMAL'])(
    'accepts %s with explicit null classification fields',
    async (classificationStatus) => {
      const result = await validate({
        classificationStatus,
        speciesLabel: null,
        confidence: null,
      });
      expect(result.classificationStatus).toBe(classificationStatus);
      expect(result.speciesLabel).toBeNull();
      expect(result.confidence).toBeNull();
    },
  );

  it.each([
    ['null species', { speciesLabel: null }],
    ['missing species', { speciesLabel: undefined }],
    ['empty species', { speciesLabel: '' }],
    ['whitespace species', { speciesLabel: ' \t\n ' }],
    ['numeric species', { speciesLabel: 123 }],
    ['null confidence', { confidence: null }],
    ['missing confidence', { confidence: undefined }],
    ['string confidence', { confidence: '0.97' }],
    ['negative confidence', { confidence: -0.01 }],
    ['confidence above one', { confidence: 1.01 }],
    ['NaN confidence', { confidence: Number.NaN }],
    ['infinite confidence', { confidence: Number.POSITIVE_INFINITY }],
    ['unknown classification status', { classificationStatus: 'OTHER' }],
    ['missing classification status', { classificationStatus: undefined }],
  ])('rejects %s', async (_label, changes) => {
    await expect(validate(changes)).rejects.toBeInstanceOf(BadRequestException);
  });

  describe.each(['UNKNOWN', 'NO_ANIMAL'])('%s', (classificationStatus) => {
    it.each([
      ['species label', { speciesLabel: 'Red fox', confidence: null }],
      ['confidence', { speciesLabel: null, confidence: 0 }],
      ['missing species', { speciesLabel: undefined, confidence: null }],
      ['missing confidence', { speciesLabel: null, confidence: undefined }],
    ])('rejects %s instead of explicit nulls', async (_label, changes) => {
      await expect(
        validate({ classificationStatus, ...changes }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('continues to reject properties outside the DTO whitelist', async () => {
    await expect(validate({ extra: true })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('includes the classification rule in the validation response', async () => {
    try {
      await validate({ confidence: null });
      expect.unreachable('Expected classification validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      if (!(error instanceof BadRequestException)) throw error;
      expect(error.getResponse()).toMatchObject({
        message: expect.arrayContaining([
          expect.stringContaining(
            'IDENTIFIED requires a nonempty speciesLabel',
          ),
        ]),
      });
    }
  });
});

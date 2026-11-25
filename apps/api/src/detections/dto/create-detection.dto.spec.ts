import { detectionInput } from '../../../test/support/fixtures.js';
import { createDetectionSchema } from './create-detection.dto.js';

describe('createDetectionSchema', () => {
  it.each([0, 0.5, 1])(
    'accepts an identified species with confidence %s',
    (confidence) => {
      const result = createDetectionSchema.safeParse({
        ...detectionInput,
        confidence,
      });

      expect(result.success).toBe(true);
    },
  );

  it.each(['UNKNOWN', 'NO_ANIMAL'])(
    'accepts %s with explicit null fields',
    (classificationStatus) => {
      const result = createDetectionSchema.safeParse({
        ...detectionInput,
        classificationStatus,
        speciesLabel: null,
        confidence: null,
      });

      expect(result.success).toBe(true);
    },
  );

  it.each([
    ['invalid UUID', { eventId: 'invalid' }],
    ['invalid deployment ID', { deploymentId: 'invalid' }],
    ['invalid date', { capturedAt: 'invalid' }],
    ['invalid classification date', { classifiedAt: 'invalid' }],
    ['empty image key', { imageKey: '' }],
    ['missing status', { classificationStatus: undefined }],
    ['invalid status', { classificationStatus: 'OTHER' }],
    ['null species for identified', { speciesLabel: null }],
    ['blank species', { speciesLabel: '   ' }],
    ['missing confidence', { confidence: undefined }],
    ['negative confidence', { confidence: -0.01 }],
    ['confidence above one', { confidence: 1.01 }],
    ['string confidence', { confidence: '0.97' }],
    ['unknown with species', { classificationStatus: 'UNKNOWN' }],
    ['extra property', { extra: true }],
  ])('rejects %s', (_description, changes) => {
    const result = createDetectionSchema.safeParse({
      ...detectionInput,
      ...changes,
    });

    expect(result.success).toBe(false);
  });

  describe.each(['UNKNOWN', 'NO_ANIMAL'])(
    '%s requires explicit null classification fields',
    (classificationStatus) => {
      it.each(['speciesLabel', 'confidence'] as const)(
        'rejects an omitted %s',
        (field) => {
          const input: Record<string, unknown> = {
            ...detectionInput,
            classificationStatus,
            speciesLabel: null,
            confidence: null,
          };
          delete input[field];

          const result = createDetectionSchema.safeParse(input);

          expect(result.success).toBe(false);
          if (result.success) throw new Error('Expected validation to fail');
          expect(result.error.issues).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ path: [field] }),
            ]),
          );
        },
      );
    },
  );

  it('accepts an omitted image key without adding a value', () => {
    const result = createDetectionSchema.parse(detectionInput);

    expect(result).not.toHaveProperty('imageKey');
  });

  it('preserves an explicitly null image key', () => {
    const result = createDetectionSchema.parse({
      ...detectionInput,
      imageKey: null,
    });

    expect(result.imageKey).toBeNull();
  });

  it('accepts equal capture and classification timestamps', () => {
    const result = createDetectionSchema.parse({
      ...detectionInput,
      classifiedAt: detectionInput.capturedAt,
    });

    expect(result.classifiedAt).toBe(result.capturedAt);
  });

  it('trims species and model version in the parsed output', () => {
    const input = {
      ...detectionInput,
      speciesLabel: '  Red fox  ',
      modelVersion: '  test-v1  ',
    };

    const result = createDetectionSchema.parse(input);

    expect(result).toEqual(detectionInput);
    expect(input.speciesLabel).toBe('  Red fox  ');
    expect(input.modelVersion).toBe('  test-v1  ');
  });

  it('rejects classification before capture', () => {
    const result = createDetectionSchema.safeParse({
      ...detectionInput,
      capturedAt: '2026-11-02T08:00:00.000Z',
      classifiedAt: '2026-11-01T08:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});

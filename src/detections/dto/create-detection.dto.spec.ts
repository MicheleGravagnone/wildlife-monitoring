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
    ['invalid date', { capturedAt: 'invalid' }],
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

  it('rejects classification before capture', () => {
    const result = createDetectionSchema.safeParse({
      ...detectionInput,
      capturedAt: '2026-11-02T08:00:00.000Z',
      classifiedAt: '2026-11-01T08:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});

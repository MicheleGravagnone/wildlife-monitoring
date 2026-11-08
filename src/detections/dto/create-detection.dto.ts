import { z } from 'zod';

const detectionFields = {
  eventId: z.uuid(),
  deploymentId: z.uuid(),
  capturedAt: z.iso.datetime(),
  imageKey: z.string().min(1).nullable().optional(),
  modelVersion: z.string().trim().min(1),
  classifiedAt: z.iso.datetime(),
};

const classificationBranches = z.discriminatedUnion('classificationStatus', [
    z.strictObject({
      ...detectionFields,
      classificationStatus: z.literal('IDENTIFIED'),
      speciesLabel: z.string().trim().min(1),
      confidence: z.number().min(0).max(1),
    }),
    z.strictObject({
      ...detectionFields,
      classificationStatus: z.enum(['UNKNOWN', 'NO_ANIMAL']),
      speciesLabel: z.null(),
      confidence: z.null(),
    }),
  ],
);

export const createDetectionSchema = classificationBranches.refine((dto) => {
  Date.parse(dto.classifiedAt) >= Date.parse(dto.capturedAt), {
    message: 'Classification time must not precede capture time',
    path: ['classifiedAt'],
  };
});

export type CreateDetectionDto = z.infer<typeof createDetectionSchema>;

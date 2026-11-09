import { z } from 'zod';

export const createDeploymentSchema = z.strictObject({
  sensorId: z.uuid(),
  name: z.string().min(2),
  parkName: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  installedAt: z.iso.datetime(),
});

export type CreateDeploymentDto = z.infer<typeof createDeploymentSchema>;

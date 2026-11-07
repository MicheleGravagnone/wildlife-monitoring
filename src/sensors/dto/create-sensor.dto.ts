import { z } from 'zod';

export const createSensorSchema = z.object({
  deviceId: z.string().min(1).nonoptional(),
  name: z.string().min(2),
});

export type CreateSensorDto = z.infer<typeof createSensorSchema>;

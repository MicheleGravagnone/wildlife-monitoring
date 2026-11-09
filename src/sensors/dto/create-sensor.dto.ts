import { z } from 'zod';

export const createSensorSchema = z.strictObject({
  deviceId: z.string().min(1),
  name: z.string().min(2),
});

export type CreateSensorDto = z.infer<typeof createSensorSchema>;

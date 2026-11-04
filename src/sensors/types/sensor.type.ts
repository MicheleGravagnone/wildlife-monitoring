import type { UUID } from 'node:crypto';

export type Sensor = Readonly<{
  id: UUID;
  deviceId: string;
  name: string;
  createdAt: string;
}>;

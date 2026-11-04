import type { UUID } from 'node:crypto';

export type Deployment = Readonly<{
  id: UUID;
  sensorId: UUID;
  name: string;
  parkName: string;
  latitude: number;
  longitude: number;
  installedAt: string;
  createdAt: string;
}>;
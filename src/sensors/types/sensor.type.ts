import type { UUID } from 'node:crypto';

export type Sensor = Readonly<{
    id: UUID;
    deviceId: string;
    name: string;
    parkName: string;
    latitude: number;
    longitude: number;
    installedAt: string;
    createdAt: string;
}>;
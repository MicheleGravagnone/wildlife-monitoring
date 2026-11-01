import { Injectable } from '@nestjs/common';
import type { Sensor } from './types/sensor.type.js';
import { randomUUID, type UUID } from 'node:crypto';
import { CreateSensorDto } from './dto/create-sensor.dto.js';

@Injectable()
export class SensorsService {

    private readonly sensors: Sensor[] = [
        {
            id: 'c3d972e5-4886-4c41-8583-529e288bd285',
            deviceId: 'esp32-test-001',
            name: 'Test deployment 1',
            parkName: 'Demo park',
            latitude: 51.7592,
            longitude: 19.456,
            installedAt: '2026-10-01T08:00:00.000Z',
            createdAt: '2026-10-01T08:00:00.000Z',
        },
        {
            id: 'f576207b-8d06-497a-97da-f4958a96908d',
            deviceId: 'esp32-test-002',
            name: 'Test deployment 2',
            parkName: 'Demo park',
            latitude: 51.76,
            longitude: 19.46,
            installedAt: '2026-10-02T08:00:00.000Z',
            createdAt: '2026-10-02T08:00:00.000Z',
        },
    ];

    getAll(): Array<Sensor> {
        return this.sensors.map(sensor => ({ ...sensor }));
    }

    getOne(id: UUID): Sensor | undefined {
        const sensor = this.sensors.find(sensor => sensor.id === id);
        return sensor ? { ...sensor } : undefined;
    }

    create(createSensorDto: CreateSensorDto): Sensor {
        const sensor = {id: randomUUID(), ...createSensorDto, createdAt: new Date().toISOString()};
        this.sensors.push(sensor);
        return sensor;
    }

}

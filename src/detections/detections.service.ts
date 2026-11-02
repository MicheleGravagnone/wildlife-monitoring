import { Injectable } from '@nestjs/common';
import type { Detection } from './types/detection.type.js';
import { ClassificationStatus } from "./enums/classification-status.enum.js";
import { randomUUID, UUID } from 'node:crypto';
import { CreateDetectionDto } from './dto/create-detection.dto.js';

@Injectable()
export class DetectionsService {

    private readonly detections: Array<Detection> = [
        {
            id: '11111111-1111-4111-8111-111111111111',
            eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
            sensorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
            capturedAt: '2026-11-01T05:30:00.000Z',
            classificationStatus: ClassificationStatus.IDENTIFIED,
            speciesLabel: 'Red fox',
            confidence: 0.97,
            imageKey: 'detections/test/red-fox.jpg',
            modelVersion: 'test-v1',
            classifiedAt: '2026-11-01T05:30:02.000Z',
            createdAt: '2026-11-01T05:30:03.000Z',
        },
        {
            id: '22222222-2222-4222-8222-222222222222',
            eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
            sensorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
            capturedAt: '2026-11-01T06:15:00.000Z',
            classificationStatus: ClassificationStatus.IDENTIFIED,
            speciesLabel: 'Wild boar',
            confidence: 0.89,
            imageKey: 'detections/test/wild-boar.jpg',
            modelVersion: 'test-v1',
            classifiedAt: '2026-11-01T06:15:02.000Z',
            createdAt: '2026-11-01T06:15:03.000Z',
        },
        {
            id: '33333333-3333-4333-8333-333333333333',
            eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
            sensorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
            capturedAt: '2026-11-01T18:45:00.000Z',
            classificationStatus: ClassificationStatus.UNKNOWN,
            speciesLabel: null,
            confidence: null,
            imageKey: 'detections/test/unknown.jpg',
            modelVersion: 'test-v1',
            classifiedAt: '2026-11-01T18:45:02.000Z',
            createdAt: '2026-11-01T18:45:03.000Z',
        },
        {
            id: '44444444-4444-4444-8444-444444444444',
            eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
            sensorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
            capturedAt: '2026-11-01T19:10:00.000Z',
            classificationStatus: ClassificationStatus.NO_ANIMAL,
            speciesLabel: null,
            confidence: 0.99,
            imageKey: null,
            modelVersion: 'test-v1',
            classifiedAt: '2026-11-01T19:10:02.000Z',
            createdAt: '2026-11-01T19:10:03.000Z',
        },
    ];

    getAll(): Array<Detection> {
        return this.detections.map(detection => ({ ...detection }));
    }

    getOne(id: UUID): Detection | undefined {
        const detection = this.detections.find(detection => detection.id === id);
        return detection ? { ...detection } : undefined;
    }

    create(createDetectionDto: CreateDetectionDto): Detection {
        const detection = { id: randomUUID(), ...createDetectionDto, createdAt: new Date().toISOString() };
        this.detections.push(detection);
        return detection;
    }

}

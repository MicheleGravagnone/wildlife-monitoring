import type {
  Sensor,
  Deployment,
  Detection,
} from '../../src/generated/prisma/client.js';
import type { CreateSensorDto } from '../../src/sensors/dto/create-sensor.dto.js';
import type { CreateDeploymentDto } from '../../src/deployments/dto/create-deployment.dto.js';
import type { CreateDetectionDto } from '../../src/detections/dto/create-detection.dto.js';

export const recordId = '11111111-1111-4111-8111-111111111111';
export const sensorInput = {
  deviceId: 'esp32-test-001',
  name: 'Test sensor',
} satisfies CreateSensorDto;
export const deploymentInput = {
  sensorId: recordId,
  name: 'North trail',
  parkName: 'Test park',
  latitude: 51.7592,
  longitude: 19.456,
  installedAt: '2026-11-01T08:00:00.000Z',
} satisfies CreateDeploymentDto;
export const detectionInput = {
  eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  deploymentId: recordId,
  capturedAt: '2026-11-02T08:00:00.000Z',
  classificationStatus: 'IDENTIFIED',
  speciesLabel: 'Red fox',
  confidence: 0.97,
  modelVersion: 'test-v1',
  classifiedAt: '2026-11-02T08:00:02.000Z',
} satisfies CreateDetectionDto;
const createdAt = new Date('2026-11-03T08:00:00.000Z');
export const sensor: Sensor = { ...sensorInput, id: recordId, createdAt };
export const deployment: Deployment = {
  ...deploymentInput,
  id: recordId,
  createdAt,
  installedAt: new Date(deploymentInput.installedAt),
};
export const detection: Detection = {
  ...detectionInput,
  id: recordId,
  createdAt,
  imageKey: null,
  capturedAt: new Date(detectionInput.capturedAt),
  classifiedAt: new Date(detectionInput.classifiedAt),
};
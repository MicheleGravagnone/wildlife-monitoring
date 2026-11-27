export type UUID = string;
export type DateTime = string;

export type ClassificationStatus = 'IDENTIFIED' | 'UNKNOWN' | 'NO_ANIMAL';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type DetectionSort = 'newest' | 'oldest' | 'species' | 'confidence';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Items<T> {
  items: T[];
}

export type Role = 'DEVELOPER' | 'ADMINISTRATOR';

export interface User {
  id: UUID;
  name: string;
  surname: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PublicDetection {
  id: UUID;
  capturedAt: DateTime;
  speciesLabel: string;
  parkName: string;
  timeOfDay: TimeOfDay;
}

export interface Detection {
  id: UUID;
  eventId: UUID;
  deploymentId: UUID;
  capturedAt: DateTime;
  classificationStatus: ClassificationStatus;
  speciesLabel: string | null;
  confidence: number | null;
  hasImage: boolean;
  modelVersion: string;
  classifiedAt: DateTime;
  createdAt: DateTime;
  latitude: number;
  longitude: number;
  parkName: string;
  deploymentName: string;
  sensorId: UUID;
  deviceId: string;
  timeOfDay: TimeOfDay;
}

export type AnyDetection = PublicDetection | Detection;

export function isStaffDetection(d: AnyDetection): d is Detection {
  return 'classificationStatus' in d;
}

export interface DetectionQuery {
  from?: DateTime;
  to?: DateTime;
  q?: string;
  species?: string[];
  parkName?: string;
  timeOfDay?: TimeOfDay[];
  deploymentId?: UUID;
  sensorId?: UUID;
  classificationStatus?: ClassificationStatus[];
  minConfidence?: number;
  sort?: DetectionSort;
  page?: number;
  pageSize?: number;
}

export interface ImageUrl {
  url: string;
  expiresAt: DateTime;
}

export interface RangeQuery {
  from?: DateTime;
  to?: DateTime;
}

export interface StatsSummary {
  sightings: number;
  species: number;
  parks: number;
  activeDeployments: number;
  lastSightingAt: DateTime | null;
}

export interface SpeciesStats {
  speciesLabel: string;
  sightings: number;
  firstSeenAt: DateTime;
  lastSeenAt: DateTime;
  topPark: string;
  hourly: number[];
}

export interface ParkStats {
  parkName: string;
  sightings: number;
  species: { speciesLabel: string; sightings: number }[];
  lastSightingAt: DateTime | null;
  lastSpeciesLabel: string | null;
}

export interface HourlyActivity {
  tz: string;
  buckets: { hour: number; sightings: number }[];
}

export interface DailyActivity {
  tz: string;
  buckets: { date: string; sightings: number }[];
}

export interface Sensor {
  id: UUID;
  deviceId: string;
  name: string;
  createdAt: DateTime;
}

export interface Deployment {
  id: UUID;
  sensorId: UUID;
  name: string;
  parkName: string;
  latitude: number;
  longitude: number;
  installedAt: DateTime;
  createdAt: DateTime;
}

export type SensorStatus = 'online' | 'attention' | 'offline' | 'unknown';

export type SensorAlertCode =
  | 'NO_HEARTBEAT'
  | 'LOW_BATTERY'
  | 'WEAK_SIGNAL'
  | 'LOW_STORAGE'
  | 'UPLOAD_RETRIES';

export interface SensorAlert {
  code: SensorAlertCode;
  since: DateTime;
}

export interface Heartbeat {
  receivedAt: DateTime;
  batteryPercent: number;
  batteryVoltage: number;
  rssi: number | null;
  firmwareVersion: string;
  temperatureC: number | null;
  storageUsedPercent: number | null;
  uptimeSeconds: number;
  powerSource: 'battery' | 'solar';
  uploadRetries24h: number;
}

export interface SensorHealth {
  sensor: Sensor;
  deployment: Deployment | null;
  status: SensorStatus;
  alerts: SensorAlert[];
  lastHeartbeat: Heartbeat | null;
  capturesToday: number;
}

export interface SensorHealthDetail extends SensorHealth {
  batterySeries: (number | null)[];
}

export interface QueueStatus {
  name: string;
  messagesReady: number;
  consumers: number;
  prefetchCount: number | null;
}

export interface PipelineStatus {
  generatedAt: DateTime;
  components: {
    database: 'up' | 'down';
    broker: 'up' | 'down';
    objectStorage: 'up' | 'down';
  };
  queues: QueueStatus[];
  hourlyClassified: number[];
  inferenceLatency: { p50: number | null; p95: number | null; samples: number };
  ingestLatencyP95Ms: number | null;
  objectStorageBytes: number | null;
  modelVersion: string | null;
}

export interface DeadLetter {
  id: UUID;
  deadLetteredAt: DateTime;
  eventId: UUID | null;
  deviceId: string | null;
  reason: string;
  attempts: number;
}

import type {
  ClassificationStatus,
  DeadLetter,
  Deployment,
  Detection,
  Heartbeat,
  PipelineStatus,
  Sensor,
  SensorAlert,
  SensorHealth,
  SensorHealthDetail,
  SensorStatus,
} from '../api/types';
import { mkRng, pickWeighted, rngUuid } from '../lib/rng';
import { SPECIES, type Activity, type Species } from '../lib/species';
import { timeOfDay } from '../lib/sun';
import { DAY, HOUR, localHour } from '../lib/time';

export const MODEL_VERSION = 'yolov8m-wild 1.3.0';

type Habitat = 'forest' | 'zoo' | 'urban';

const HABITATS: Record<
  Habitat,
  { weight: number; species: Record<string, number> }
> = {
  forest: {
    weight: 1.5,
    species: { fox: 3, deer: 4, boar: 3, badger: 2, squirrel: 3, hare: 1.5 },
  },
  zoo: {
    weight: 1.2,
    species: {
      fox: 3,
      squirrel: 4,
      deer: 1,
      hedgehog: 0.5,
      marten: 1.5,
      hare: 1.5,
    },
  },
  urban: {
    weight: 0.8,
    species: { squirrel: 5, fox: 2, marten: 1.5, hedgehog: 0.4 },
  },
};

const DEPLOYMENT_DEFS: [string, string, number, number, Habitat][] = [
  ['Fountain glade', 'Park Źródliska', 51.7598, 19.4745, 'urban'],
  ['East lawn', 'Park Poniatowskiego', 51.752, 19.439, 'urban'],
  ['North meadow', 'Park na Zdrowiu', 51.766, 19.408, 'zoo'],
  ['Zoo edge', 'Park na Zdrowiu', 51.7605, 19.419, 'zoo'],
  ['Oak stand', 'Las Łagiewnicki', 51.836, 19.468, 'forest'],
  ['Ravine', 'Las Łagiewnicki', 51.8295, 19.486, 'forest'],
  ['Pond trail', 'Arturówek', 51.8265, 19.515, 'forest'],
  ['Sokołówka bank', 'Park Julianowski', 51.806, 19.445, 'urban'],
  ['Old trees', 'Park Helenów', 51.7835, 19.464, 'urban'],
  ['East glade', 'Park im. 3 Maja', 51.7605, 19.504, 'urban'],
  ['Łódka valley', 'Park Staromiejski', 51.779, 19.454, 'urban'],
  ['Arboretum', 'Ogród Botaniczny', 51.7555, 19.401, 'zoo'],
];

const OFFLINE = 6;
const NO_TELEMETRY = 11;

export interface MockDeployment extends Deployment {
  habitat: Habitat;
  deviceId: string;
  index: number;
}

export const SESSION_START = Date.now();
const OFFLINE_SINCE = SESSION_START - (5 * 60 + 12) * 60_000;

const setupRng = mkRng(99);
const installBase = Date.UTC(2026, 8, 1);

export const sensors: Sensor[] = DEPLOYMENT_DEFS.map((_, i) => ({
  id: rngUuid(setupRng),
  deviceId: `esp32-cam-${String(i + 1).padStart(2, '0')}`,
  name: `Camera trap ${i + 1}`,
  createdAt: new Date(installBase - 3 * DAY).toISOString(),
}));

export const deployments: MockDeployment[] = DEPLOYMENT_DEFS.map(
  ([name, parkName, lat, lon, habitat], i) => {
    const installedAt = new Date(
      installBase + Math.floor(setupRng() * 40) * DAY + 8 * HOUR,
    ).toISOString();
    return {
      id: rngUuid(setupRng),
      sensorId: sensors[i].id,
      name,
      parkName,
      latitude: lat,
      longitude: lon,
      installedAt,
      createdAt: installedAt,
      habitat,
      deviceId: sensors[i].deviceId,
      index: i,
    };
  },
);

export const pastDeployments: Deployment[] = [
  {
    id: rngUuid(setupRng),
    sensorId: sensors[3].id,
    name: 'Old pond',
    parkName: 'Park na Zdrowiu',
    latitude: 51.7621,
    longitude: 19.4152,
    installedAt: new Date(Date.UTC(2026, 7, 2, 9)).toISOString(),
    createdAt: new Date(Date.UTC(2026, 7, 2, 9)).toISOString(),
  },
];

function activityWeight(act: Activity, t: number): number {
  const tod = timeOfDay(t);
  const twilight = tod === 'dawn' || tod === 'dusk';
  if (act === 'crep') return twilight ? 5 : tod === 'night' ? 1 : 0.4;
  if (act === 'crepnoc') return twilight ? 4 : tod === 'night' ? 3 : 0.3;
  if (act === 'noc') return tod === 'night' ? 4 : twilight ? 1.5 : 0.1;
  return tod === 'day' ? 4 : twilight ? 2 : 0.05;
}

function makeDetection(
  t: number,
  r: () => number,
  depFilter?: (d: MockDeployment) => boolean,
): Detection {
  const candidates = depFilter ? deployments.filter(depFilter) : deployments;
  const dep = pickWeighted(r, candidates, (d) => HABITATS[d.habitat].weight);
  const spMap = HABITATS[dep.habitat].species;
  const cands = SPECIES.filter((s) => spMap[s.key]);
  const sp: Species = pickWeighted(
    r,
    cands,
    (s) => spMap[s.key] * activityWeight(s.act, t),
  );
  const roll = r();
  const status: ClassificationStatus =
    roll < 0.8 ? 'IDENTIFIED' : roll < 0.92 ? 'UNKNOWN' : 'NO_ANIMAL';
  const classifiedAt = t + 1200 + Math.floor(r() * 5200);
  const identified = status === 'IDENTIFIED';
  return {
    id: rngUuid(r),
    eventId: rngUuid(r),
    deploymentId: dep.id,
    capturedAt: new Date(t).toISOString(),
    classificationStatus: status,
    speciesLabel: identified ? sp.label : null,
    confidence: identified
      ? Math.round((0.58 + r() * 0.41) * 1000) / 1000
      : null,
    hasImage: r() > 0.06,
    modelVersion: MODEL_VERSION,
    classifiedAt: new Date(classifiedAt).toISOString(),
    createdAt: new Date(classifiedAt + 40).toISOString(),
    latitude: dep.latitude,
    longitude: dep.longitude,
    parkName: dep.parkName,
    deploymentName: dep.name,
    sensorId: dep.sensorId,
    deviceId: dep.deviceId,
    timeOfDay: timeOfDay(t),
  };
}

function generate(): Detection[] {
  const out: Detection[] = [];
  const today = Math.floor(SESSION_START / DAY);
  const keep = (rec: Detection) => {
    const dep = deployments.find((d) => d.id === rec.deploymentId);
    if (dep?.index === OFFLINE && Date.parse(rec.capturedAt) > OFFLINE_SINCE)
      return;
    if (Date.parse(rec.capturedAt) < Date.parse(dep?.installedAt ?? '')) return;
    out.push(rec);
  };

  for (let day = today - 31; day <= today + 1; day++) {
    const r = mkRng(day * 7919);
    const n = 20 + Math.floor(r() * 12);
    const slots = Array.from({ length: 48 }, (_, h) => {
      const t = day * DAY + h * 30 * 60_000;
      return {
        t,
        w: 0.4 + activityWeight('crepnoc', t) + activityWeight('day', t) * 0.4,
      };
    });
    for (let k = 0; k < n; k++) {
      const slot = pickWeighted(r, slots, (s) => s.w);
      keep(makeDetection(slot.t + Math.floor(r() * 30 * 60_000), r));
    }
  }

  for (let day = today - 31; day <= today + 1; day++) {
    const r = mkRng(day * 104729 + 7);
    for (let k = 0; k < 40; k++) {
      const t = day * DAY + Math.floor(r() * DAY);
      if (timeOfDay(t) === 'day' && r() > 0.2) continue;
      keep(makeDetection(t, r));
    }
  }

  const r = mkRng(SESSION_START % 1_000_003);
  for (
    let t = SESSION_START - 40 * 60_000;
    t < SESSION_START + DAY;
    t += 1000
  ) {
    if (r() < 1 / 75) keep(makeDetection(t, r, (d) => d.index !== OFFLINE));
  }

  return out.sort(
    (a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt),
  );
}

const ALL = generate();

export function detectionsUntil(now = Date.now()): Detection[] {
  let hi = ALL.length;
  let lo = 0;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (Date.parse(ALL[mid].capturedAt) <= now) lo = mid + 1;
    else hi = mid;
  }
  return ALL.slice(0, lo);
}

export function findDetection(
  id: string,
  now = Date.now(),
): Detection | undefined {
  return detectionsUntil(now).find((d) => d.id === id);
}

interface Telemetry {
  status: Exclude<SensorStatus, 'unknown'>;
  battery: number;
  rssi: number | null;
  firmware: string;
  power: 'battery' | 'solar';
  seenSeconds: number;
  retries: number;
  temp: number;
  storage: number;
  uptimeDays: number;
  series: number[];
}

const telemetry: (Telemetry | null)[] = deployments.map((d) => {
  if (d.index === NO_TELEMETRY) return null;
  const r = mkRng(515 + d.index * 31);
  let status: Telemetry['status'] = 'online';
  let battery = Math.round(55 + r() * 43);
  let rssi: number | null = -52 - Math.round(r() * 20);
  let retries = 0;
  const power = d.habitat === 'forest' ? 'battery' : 'solar';
  if (d.index === OFFLINE) {
    status = 'offline';
    battery = 3;
    rssi = null;
  }
  if (d.index === 1) {
    status = 'attention';
    battery = 12;
  }
  if (d.index === 10) {
    status = 'attention';
    rssi = -88;
    retries = 6;
  }
  const series: number[] = [];
  let b = Math.min(100, battery + 8 + r() * 6);
  for (let k = 0; k < 25; k++) {
    const hr = (localHour(SESSION_START) - 24 + k + 48) % 24;
    const sun =
      hr >= 9 && hr <= 14 && power === 'solar' && status !== 'offline';
    b += sun ? 1.2 + r() * 1.4 : -(0.45 + r() * 0.5);
    if (k === 24) b = battery;
    if (d.index === OFFLINE && k > 18) b = Math.max(3, b - 2.5);
    series.push(Math.round(Math.max(0, Math.min(100, b)) * 10) / 10);
  }
  return {
    status,
    battery,
    rssi,
    firmware: d.index === 4 ? '2.3.0' : '2.4.1',
    power,
    seenSeconds: 15 + Math.floor(r() * 200),
    retries,
    temp: Math.round((2 + r() * 5) * 10) / 10,
    storage: Math.round(5 + r() * 55),
    uptimeDays: Math.round(3 + r() * 26),
    series,
  };
});

function heartbeatFor(t: Telemetry, now: number): Heartbeat {
  const seen =
    t.status === 'offline'
      ? (now - OFFLINE_SINCE) / 1000
      : ((t.seenSeconds + Math.floor((now - SESSION_START) / 1000) * 7) % 240) +
        5;
  return {
    receivedAt: new Date(now - seen * 1000).toISOString(),
    batteryPercent: t.battery,
    batteryVoltage: Math.round((3.2 + (t.battery / 100) * 0.95) * 100) / 100,
    rssi: t.rssi,
    firmwareVersion: t.firmware,
    temperatureC: t.temp,
    storageUsedPercent: t.storage,
    uptimeSeconds: t.status === 'offline' ? 0 : t.uptimeDays * 86400,
    powerSource: t.power,
    uploadRetries24h: t.retries,
  };
}

function alertsFor(t: Telemetry, now: number): SensorAlert[] {
  const alerts: SensorAlert[] = [];
  if (t.status === 'offline')
    alerts.push({
      code: 'NO_HEARTBEAT',
      since: new Date(OFFLINE_SINCE).toISOString(),
    });
  if (t.battery < 20 && t.status !== 'offline')
    alerts.push({
      code: 'LOW_BATTERY',
      since: new Date(now - 4.5 * HOUR).toISOString(),
    });
  if (t.rssi != null && t.rssi < -85)
    alerts.push({
      code: 'WEAK_SIGNAL',
      since: new Date(now - 2 * HOUR).toISOString(),
    });
  if (t.retries > 3)
    alerts.push({
      code: 'UPLOAD_RETRIES',
      since: new Date(now - 1.8 * HOUR).toISOString(),
    });
  return alerts;
}

function startOfLocalDay(now: number): number {
  return (
    now -
    ((localHour(now) * 60 + new Date(now).getUTCMinutes()) * 60_000 +
      new Date(now).getUTCSeconds() * 1000)
  );
}

export function sensorHealth(now = Date.now()): SensorHealth[] {
  const midnight = startOfLocalDay(now);
  const recs = detectionsUntil(now).filter(
    (d) => Date.parse(d.capturedAt) >= midnight,
  );
  const rank: Record<SensorStatus, number> = {
    offline: 0,
    attention: 1,
    unknown: 2,
    online: 3,
  };
  return deployments
    .map((d, i) => {
      const t = telemetry[i];
      const { habitat: _h, deviceId: _d, index: _i, ...deployment } = d;
      return {
        sensor: sensors[i],
        deployment,
        status: (t ? t.status : 'unknown') as SensorStatus,
        alerts: t ? alertsFor(t, now) : [],
        lastHeartbeat: t ? heartbeatFor(t, now) : null,
        capturesToday: recs.filter((x) => x.deploymentId === d.id).length,
      };
    })
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        a.deployment.parkName.localeCompare(b.deployment.parkName),
    );
}

export function sensorHealthDetail(
  sensorId: string,
  now = Date.now(),
): SensorHealthDetail | undefined {
  const h = sensorHealth(now).find((s) => s.sensor.id === sensorId);
  if (!h) return undefined;
  const t = telemetry[sensors.findIndex((s) => s.id === sensorId)];
  return {
    ...h,
    batterySeries: t ? t.series : Array.from({ length: 25 }, () => null),
  };
}

export function pipeline(now = Date.now()): PipelineStatus {
  const recs = detectionsUntil(now).filter(
    (d) => Date.parse(d.capturedAt) > now - DAY,
  );
  const hourly = Array.from({ length: 24 }, () => 0);
  for (const x of recs) {
    hourly[
      Math.min(23, Math.floor((Date.parse(x.capturedAt) - (now - DAY)) / HOUR))
    ]++;
  }
  const lats = recs
    .map((x) => (Date.parse(x.classifiedAt) - Date.parse(x.capturedAt)) / 1000)
    .sort((a, b) => a - b);
  const q = (p: number) =>
    lats.length
      ? Math.round(
          lats[Math.min(lats.length - 1, Math.floor(p * lats.length))] * 10,
        ) / 10
      : null;
  const tick = Math.floor(now / 10_000);
  return {
    generatedAt: new Date(now).toISOString(),
    components: { database: 'up', broker: 'up', objectStorage: 'up' },
    queues: [
      {
        name: 'captures.raw',
        messagesReady: Math.round(2 + 4 * Math.abs(Math.sin(tick / 4))),
        consumers: 2,
        prefetchCount: 2,
      },
      {
        name: 'detections.classified',
        messagesReady: tick % 3 === 0 ? 1 : 0,
        consumers: 1,
        prefetchCount: 10,
      },
      {
        name: 'captures.dlq',
        messagesReady: deadLetters(now).length,
        consumers: 1,
        prefetchCount: null,
      },
    ],
    hourlyClassified: hourly,
    inferenceLatency: { p50: q(0.5), p95: q(0.95), samples: lats.length },
    ingestLatencyP95Ms: 24,
    objectStorageBytes: 41_017_354_240,
    modelVersion: MODEL_VERSION,
  };
}

export function deadLetters(now = Date.now()): DeadLetter[] {
  const r = mkRng(4242);
  const rows: [number, number | null, string, number][] = [
    [47, 6, 'imageKey not found in object storage (upload interrupted)', 3],
    [3.3 * 60, 10, 'Payload rejected: capturedAt missing', 1],
    [
      7.5 * 60,
      4,
      'Inference failed: CUDA out of memory during model reload',
      3,
    ],
    [11.6 * 60, null, 'Unreadable message body', 1],
  ];
  return rows.map(([minsAgo, dep, reason, attempts]) => ({
    id: rngUuid(r),
    deadLetteredAt: new Date(now - minsAgo * 60_000).toISOString(),
    eventId: dep == null ? null : rngUuid(r),
    deviceId: dep == null ? null : deployments[dep].deviceId,
    reason,
    attempts,
  }));
}

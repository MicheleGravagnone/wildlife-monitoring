import type {
  ClassificationStatus,
  DailyActivity,
  Detection,
  DetectionQuery,
  DetectionSort,
  HourlyActivity,
  Page,
  ParkStats,
  PublicDetection,
  SpeciesStats,
  StatsSummary,
  TimeOfDay,
} from '../api/types';
import { PARKS } from '../lib/parks';
import { DAY, fmtDate, localHour } from '../lib/time';
import { deployments } from './db';

export function toPublic(d: Detection): PublicDetection {
  return {
    id: d.id,
    capturedAt: d.capturedAt,
    speciesLabel: d.speciesLabel ?? '',
    parkName: d.parkName,
    timeOfDay: d.timeOfDay,
  };
}

export function parseDetectionQuery(params: URLSearchParams): DetectionQuery {
  const num = (k: string) =>
    params.has(k) ? Number(params.get(k)) : undefined;
  const str = (k: string) => params.get(k) || undefined;
  const all = (k: string) =>
    params.getAll(k).length ? params.getAll(k) : undefined;
  return {
    from: str('from'),
    to: str('to'),
    q: str('q'),
    species: all('species'),
    parkName: str('parkName'),
    timeOfDay: all('timeOfDay') as TimeOfDay[] | undefined,
    deploymentId: str('deploymentId'),
    sensorId: str('sensorId'),
    classificationStatus: all('classificationStatus') as
      ClassificationStatus[] | undefined,
    minConfidence: num('minConfidence'),
    sort: (str('sort') as DetectionSort | undefined) ?? 'newest',
    page: num('page') ?? 1,
    pageSize: num('pageSize') ?? 24,
  };
}

export function validateDetectionQuery(q: DetectionQuery): string[] {
  const errors: string[] = [];
  if (q.from && Number.isNaN(Date.parse(q.from)))
    errors.push('from must be an ISO 8601 date-time');
  if (q.to && Number.isNaN(Date.parse(q.to)))
    errors.push('to must be an ISO 8601 date-time');
  if (q.page !== undefined && (!Number.isInteger(q.page) || q.page < 1))
    errors.push('page must be an integer ≥ 1');
  if (
    q.pageSize !== undefined &&
    (!Number.isInteger(q.pageSize) || q.pageSize < 1 || q.pageSize > 500)
  )
    errors.push('pageSize must be an integer between 1 and 500');
  if (q.sort && !['newest', 'oldest', 'species', 'confidence'].includes(q.sort))
    errors.push('sort must be one of newest, oldest, species, confidence');
  return errors;
}

const inRange = (d: { capturedAt: string }, from?: string, to?: string) => {
  const t = Date.parse(d.capturedAt);
  return (!from || t >= Date.parse(from)) && (!to || t < Date.parse(to));
};

export function filterDetections(
  all: Detection[],
  q: DetectionQuery,
  staff: boolean,
): Detection[] {
  const needle = q.q?.trim().toLowerCase();
  return all.filter((d) => {
    if (!staff && d.classificationStatus !== 'IDENTIFIED') return false;
    if (!inRange(d, q.from, q.to)) return false;
    if (
      q.species?.length &&
      !(d.speciesLabel && q.species.includes(d.speciesLabel))
    )
      return false;
    if (q.parkName && d.parkName !== q.parkName) return false;
    if (q.timeOfDay?.length && !q.timeOfDay.includes(d.timeOfDay)) return false;
    if (staff) {
      if (q.deploymentId && d.deploymentId !== q.deploymentId) return false;
      if (q.sensorId && d.sensorId !== q.sensorId) return false;
      if (
        q.classificationStatus?.length &&
        !q.classificationStatus.includes(d.classificationStatus)
      )
        return false;
      if (
        q.minConfidence !== undefined &&
        !(d.confidence != null && d.confidence >= q.minConfidence)
      )
        return false;
    }
    if (needle) {
      const species = (d.speciesLabel ?? '').toLowerCase();
      const staffHit =
        staff &&
        (d.deviceId.toLowerCase().includes(needle) ||
          d.id.startsWith(needle) ||
          d.eventId.startsWith(needle));
      if (!species.includes(needle) && !staffHit) return false;
    }
    return true;
  });
}

export function sortDetections(
  list: Detection[],
  sort: DetectionSort,
  staff: boolean,
): Detection[] {
  const t = (d: Detection) => Date.parse(d.capturedAt);
  const s = [...list];
  if (sort === 'oldest') return s.sort((a, b) => t(a) - t(b));
  if (sort === 'species')
    return s.sort(
      (a, b) =>
        (a.speciesLabel ?? '~').localeCompare(b.speciesLabel ?? '~') ||
        t(b) - t(a),
    );
  if (sort === 'confidence' && staff)
    return s.sort(
      (a, b) => (b.confidence ?? -1) - (a.confidence ?? -1) || t(b) - t(a),
    );
  return s.sort((a, b) => t(b) - t(a));
}

export function pageOf<T>(list: T[], page = 1, pageSize = 24): Page<T> {
  return {
    items: list.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: list.length,
  };
}

export function listDetections(
  all: Detection[],
  q: DetectionQuery,
  staff: boolean,
): Page<Detection> | Page<PublicDetection> {
  const sorted = sortDetections(
    filterDetections(all, q, staff),
    q.sort ?? 'newest',
    staff,
  );
  const page = pageOf(sorted, q.page, q.pageSize);
  return staff ? page : { ...page, items: page.items.map(toPublic) };
}

const identified = (all: Detection[], from?: string, to?: string) =>
  all.filter(
    (d) => d.classificationStatus === 'IDENTIFIED' && inRange(d, from, to),
  );

export function summary(
  all: Detection[],
  from?: string,
  to?: string,
): StatsSummary {
  const ids = identified(all, from, to);
  return {
    sightings: ids.length,
    species: new Set(ids.map((d) => d.speciesLabel)).size,
    parks: new Set(deployments.map((d) => d.parkName)).size,
    activeDeployments: deployments.length,
    lastSightingAt: ids.length ? ids[ids.length - 1].capturedAt : null,
  };
}

export function speciesStats(
  all: Detection[],
  from?: string,
  to?: string,
  parkName?: string,
): SpeciesStats[] {
  const ids = identified(all, from, to).filter(
    (d) => !parkName || d.parkName === parkName,
  );
  const by = new Map<string, Detection[]>();
  for (const d of ids)
    by.set(d.speciesLabel!, [...(by.get(d.speciesLabel!) ?? []), d]);
  return [...by.entries()]
    .map(([label, recs]) => {
      const hourly = Array.from({ length: 24 }, () => 0);
      const parks = new Map<string, number>();
      for (const r of recs) {
        hourly[localHour(r.capturedAt)]++;
        parks.set(r.parkName, (parks.get(r.parkName) ?? 0) + 1);
      }
      return {
        speciesLabel: label,
        sightings: recs.length,
        firstSeenAt: recs[0].capturedAt,
        lastSeenAt: recs[recs.length - 1].capturedAt,
        topPark: [...parks.entries()].sort((a, b) => b[1] - a[1])[0][0],
        hourly,
      };
    })
    .sort((a, b) => b.sightings - a.sightings);
}

export function parkStats(
  all: Detection[],
  from?: string,
  to?: string,
  species?: string[],
): ParkStats[] {
  const ids = identified(all, from, to).filter(
    (d) => !species?.length || species.includes(d.speciesLabel!),
  );
  return PARKS.map((p) => p.name)
    .filter((name) => deployments.some((d) => d.parkName === name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const recs = ids.filter((d) => d.parkName === name);
      const tally = new Map<string, number>();
      for (const r of recs)
        tally.set(r.speciesLabel!, (tally.get(r.speciesLabel!) ?? 0) + 1);
      const last = recs[recs.length - 1];
      return {
        parkName: name,
        sightings: recs.length,
        species: [...tally.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([speciesLabel, sightings]) => ({ speciesLabel, sightings })),
        lastSightingAt: last?.capturedAt ?? null,
        lastSpeciesLabel: last?.speciesLabel ?? null,
      };
    });
}

export function hourlyActivity(
  all: Detection[],
  from?: string,
  to?: string,
  species?: string[],
  parkName?: string,
): HourlyActivity {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sightings: 0,
  }));
  for (const d of identified(all, from, to)) {
    if (species?.length && !species.includes(d.speciesLabel!)) continue;
    if (parkName && d.parkName !== parkName) continue;
    buckets[localHour(d.capturedAt)].sightings++;
  }
  return { tz: 'Europe/Warsaw', buckets };
}

export function dailyActivity(
  all: Detection[],
  now: number,
  days = 30,
  species?: string[],
  parkName?: string,
): DailyActivity {
  const dates = Array.from({ length: days }, (_, i) =>
    fmtDate(now - (days - 1 - i) * DAY),
  );
  const counts = new Map(dates.map((d) => [d, 0]));
  for (const d of identified(
    all,
    new Date(now - (days + 1) * DAY).toISOString(),
  )) {
    if (species?.length && !species.includes(d.speciesLabel!)) continue;
    if (parkName && d.parkName !== parkName) continue;
    const key = fmtDate(d.capturedAt);
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  }
  return {
    tz: 'Europe/Warsaw',
    buckets: dates.map((date) => ({ date, sightings: counts.get(date)! })),
  };
}

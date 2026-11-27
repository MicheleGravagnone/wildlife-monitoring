import type {
  ClassificationStatus,
  DetectionQuery,
  DetectionSort,
  TimeOfDay,
} from '../../api/types';
import { DAY, HOUR, localHour, rangeFrom, type Range } from '../../lib/time';

export type Tod = TimeOfDay | 'any';
export type StatusFilter = ClassificationStatus | 'all';

export interface JournalFilters {
  q: string;
  species: string[];
  park: string;
  period: Range;
  day: string | null;
  tod: Tod;
  status: StatusFilter;
  minScore: number;
  sort: DetectionSort;
  page: number;
}

export const DEFAULT_FILTERS: JournalFilters = {
  q: '',
  species: [],
  park: 'all',
  period: '30d',
  day: null,
  tod: 'any',
  status: 'all',
  minScore: 0,
  sort: 'newest',
  page: 1,
};

const RANGES: Range[] = ['24h', '7d', '30d'];
const TODS: Tod[] = ['any', 'dawn', 'day', 'dusk', 'night'];
const STATUSES: StatusFilter[] = ['all', 'IDENTIFIED', 'UNKNOWN', 'NO_ANIMAL'];
const SORTS: DetectionSort[] = ['newest', 'oldest', 'species', 'confidence'];

const oneOf = <T extends string>(v: string | null, all: T[], dflt: T): T =>
  v && (all as string[]).includes(v) ? (v as T) : dflt;

export function readFilters(p: URLSearchParams): JournalFilters {
  const page = Number(p.get('page'));
  const minScore = Number(p.get('min'));
  return {
    q: p.get('q') ?? '',
    species: p.getAll('species'),
    park: p.get('park') ?? 'all',
    period: oneOf(p.get('period'), RANGES, '30d'),
    day: /^\d{4}-\d{2}-\d{2}$/.test(p.get('day') ?? '') ? p.get('day') : null,
    tod: oneOf(p.get('tod'), TODS, 'any'),
    status: oneOf(p.get('status'), STATUSES, 'all'),
    minScore: minScore > 0 && minScore <= 1 ? minScore : 0,
    sort: oneOf(p.get('sort'), SORTS, 'newest'),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export function writeFilters(
  f: JournalFilters,
  keep?: URLSearchParams,
): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  f.species.forEach((s) => p.append('species', s));
  if (f.park !== 'all') p.set('park', f.park);
  if (f.period !== '30d') p.set('period', f.period);
  if (f.day) p.set('day', f.day);
  if (f.tod !== 'any') p.set('tod', f.tod);
  if (f.status !== 'all') p.set('status', f.status);
  if (f.minScore > 0) p.set('min', String(f.minScore));
  if (f.sort !== 'newest') p.set('sort', f.sort);
  if (f.page > 1) p.set('page', String(f.page));
  const id = keep?.get('id');
  if (id) p.set('id', id);
  return p;
}

export function localDayBounds(date: string): { from: string; to: string } {
  const noonUtc = Date.parse(`${date}T12:00:00Z`);
  const offset = localHour(noonUtc) - 12;
  const start = Date.parse(`${date}T00:00:00Z`) - offset * HOUR;
  return {
    from: new Date(start).toISOString(),
    to: new Date(start + DAY).toISOString(),
  };
}

export function activeCount(f: JournalFilters, staff: boolean): number {
  return (
    (f.q.trim() ? 1 : 0) +
    f.species.length +
    (f.park !== 'all' ? 1 : 0) +
    (f.period !== '30d' || f.day ? 1 : 0) +
    (f.tod !== 'any' ? 1 : 0) +
    (staff && f.status !== 'all' ? 1 : 0) +
    (staff && f.minScore > 0 ? 1 : 0)
  );
}

export function toQuery(
  f: JournalFilters,
  staff: boolean,
  pageSize: number,
  now: number,
): DetectionQuery {
  const range = f.day
    ? localDayBounds(f.day)
    : { from: rangeFrom(f.period, now), to: undefined };
  return {
    ...range,
    q: f.q.trim() || undefined,
    species: f.species.length ? f.species : undefined,
    parkName: f.park !== 'all' ? f.park : undefined,
    timeOfDay: f.tod !== 'any' ? [f.tod] : undefined,
    classificationStatus: staff && f.status !== 'all' ? [f.status] : undefined,
    minConfidence: staff && f.minScore > 0 ? f.minScore : undefined,
    sort: !staff && f.sort === 'confidence' ? 'newest' : f.sort,
    page: f.page,
    pageSize,
  };
}

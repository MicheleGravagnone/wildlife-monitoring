import { describe, expect, it } from 'vitest';
import type { PublicDetection } from '../api/types';
import { detectionsUntil } from './db';
import {
  dailyActivity,
  hourlyActivity,
  listDetections,
  parkStats,
  parseDetectionQuery,
  validateDetectionQuery,
} from './queries';

const now = Date.now();
const all = detectionsUntil(now);

describe('mock detections', () => {
  it('generates a month of history and nothing from the future', () => {
    expect(all.length).toBeGreaterThan(500);
    expect(all.every((d) => Date.parse(d.capturedAt) <= now)).toBe(true);
    expect(Date.parse(all[0].capturedAt)).toBeLessThan(now - 29 * 86_400_000);
  });

  it('never gives visitors coordinates, statuses or unidentified records', () => {
    const page = listDetections(all, { pageSize: 500 }, false);
    expect(page.total).toBeGreaterThan(0);
    for (const d of page.items as PublicDetection[]) {
      expect(Object.keys(d).sort()).toEqual([
        'capturedAt',
        'id',
        'parkName',
        'speciesLabel',
        'timeOfDay',
      ]);
      expect(d.speciesLabel).not.toBe('');
    }
  });

  it('ignores staff-only filters for visitors', () => {
    const q = { classificationStatus: ['UNKNOWN' as const], pageSize: 5 };
    expect(listDetections(all, q, false).total).toBe(
      listDetections(all, { pageSize: 5 }, false).total,
    );
    const staff = listDetections(all, q, true);
    expect(
      staff.items.every(
        (d) =>
          'classificationStatus' in d && d.classificationStatus === 'UNKNOWN',
      ),
    ).toBe(true);
  });

  it('pages and sorts', () => {
    const p1 = listDetections(
      all,
      { page: 1, pageSize: 10, sort: 'oldest' },
      true,
    );
    const p2 = listDetections(
      all,
      { page: 2, pageSize: 10, sort: 'oldest' },
      true,
    );
    expect(p1.items).toHaveLength(10);
    expect(Date.parse(p1.items[9].capturedAt)).toBeLessThanOrEqual(
      Date.parse(p2.items[0].capturedAt),
    );
    expect(p1.total).toBe(all.length);
  });

  it('parses repeated parameters and rejects bad ones', () => {
    const q = parseDetectionQuery(
      new URLSearchParams('species=Red+fox&species=Roe+deer&page=2'),
    );
    expect(q.species).toEqual(['Red fox', 'Roe deer']);
    expect(q.page).toBe(2);
    expect(validateDetectionQuery({ page: 0 })).toHaveLength(1);
    expect(validateDetectionQuery({ from: 'yesterday' })).toHaveLength(1);
  });
});

describe('mock statistics', () => {
  it('returns 24 hourly and 30 daily buckets', () => {
    expect(hourlyActivity(all).buckets).toHaveLength(24);
    const daily = dailyActivity(all, now);
    expect(daily.buckets).toHaveLength(30);
    expect(daily.buckets.reduce((s, b) => s + b.sightings, 0)).toBeGreaterThan(
      0,
    );
  });

  it('lists every park with a deployment and no coordinates', () => {
    const parks = parkStats(all);
    expect(parks).toHaveLength(10);
    for (const p of parks) expect(p).not.toHaveProperty('latitude');
  });
});

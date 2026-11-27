import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  localDayBounds,
  readFilters,
  toQuery,
  writeFilters,
} from './filters';

describe('journal filters', () => {
  it('round-trips through the URL and drops defaults', () => {
    const f = {
      ...DEFAULT_FILTERS,
      species: ['Red fox', 'Roe deer'],
      park: 'Arturówek',
      tod: 'night' as const,
      page: 3,
    };
    const p = writeFilters(f);
    expect(p.toString()).toBe(
      'species=Red+fox&species=Roe+deer&park=Artur%C3%B3wek&tod=night&page=3',
    );
    expect(readFilters(p)).toEqual(f);
    expect(writeFilters(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('ignores invalid values from hand-edited URLs', () => {
    const f = readFilters(
      new URLSearchParams('period=1y&tod=noon&page=-2&min=7&day=yesterday'),
    );
    expect(f).toEqual(DEFAULT_FILTERS);
  });

  it('keeps staff-only filters out of visitor queries', () => {
    const f = {
      ...DEFAULT_FILTERS,
      status: 'UNKNOWN' as const,
      minScore: 0.85,
      sort: 'confidence' as const,
    };
    const visitor = toQuery(f, false, 12, Date.now());
    expect(visitor.classificationStatus).toBeUndefined();
    expect(visitor.minConfidence).toBeUndefined();
    expect(visitor.sort).toBe('newest');
    const staff = toQuery(f, true, 12, Date.now());
    expect(staff.classificationStatus).toEqual(['UNKNOWN']);
    expect(staff.minConfidence).toBe(0.85);
  });

  it('turns a local day into UTC bounds (Łódź is UTC+1 in November)', () => {
    expect(localDayBounds('2026-11-19')).toEqual({
      from: '2026-11-18T23:00:00.000Z',
      to: '2026-11-19T23:00:00.000Z',
    });
    expect(localDayBounds('2026-07-01').from).toBe('2026-06-30T22:00:00.000Z');
  });
});

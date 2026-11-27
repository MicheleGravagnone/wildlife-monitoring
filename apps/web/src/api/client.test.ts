import { describe, expect, it } from 'vitest';
import { toSearch } from './client';

describe('toSearch', () => {
  it('repeats array keys and drops empty values', () => {
    expect(
      toSearch({
        species: ['Red fox', 'Roe deer'],
        parkName: undefined,
        q: '',
        page: 2,
      }),
    ).toBe('?species=Red+fox&species=Roe+deer&page=2');
  });

  it('returns an empty string when nothing is set', () => {
    expect(toSearch({ a: undefined, b: [] })).toBe('');
    expect(toSearch(undefined)).toBe('');
  });
});

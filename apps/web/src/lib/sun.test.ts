import { describe, expect, it } from 'vitest';
import { lastNight, sunTimes, timeOfDay } from './sun';

describe('timeOfDay in Łódź', () => {
  const day = Date.UTC(2026, 10, 19);
  const { sunrise, sunset } = sunTimes(day + 12 * 3_600_000);

  it('finds plausible November sun times', () => {
    expect(new Date(sunrise).getUTCHours()).toBe(6);
    expect(new Date(sunset).getUTCHours()).toBe(14);
  });

  it('classifies the hour around sunrise as dawn', () => {
    expect(timeOfDay(sunrise - 30 * 60_000)).toBe('dawn');
    expect(timeOfDay(sunrise + 59 * 60_000)).toBe('dawn');
  });

  it('classifies midday as day, the hour around sunset as dusk and midnight as night', () => {
    expect(timeOfDay(day + 11 * 3_600_000)).toBe('day');
    expect(timeOfDay(sunset + 20 * 60_000)).toBe('dusk');
    expect(timeOfDay(day + 23 * 3_600_000)).toBe('night');
  });

  it('follows the seasons', () => {
    expect(timeOfDay(Date.UTC(2026, 5, 21, 17))).toBe('day');
    expect(timeOfDay(Date.UTC(2026, 10, 21, 17))).toBe('night');
  });
});

describe('lastNight', () => {
  it('spans yesterday’s sunset to this morning’s sunrise during the day', () => {
    const now = Date.UTC(2026, 10, 19, 12);
    const n = lastNight(now);
    expect(new Date(n.sunset).getUTCDate()).toBe(18);
    expect(new Date(n.sunrise).getUTCDate()).toBe(19);
    expect(n.sunrise).toBeLessThan(now);
  });
});

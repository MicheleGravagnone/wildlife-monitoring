import { getTimes } from 'suncalc';
import type { TimeOfDay } from '../api/types';
import { HOUR, localHour } from './time';

export const LODZ = { lat: 51.76, lon: 19.46 };

export function sunTimes(t: number): { sunrise: number; sunset: number } {
  const noon = new Date(t);
  noon.setUTCHours(11, 0, 0, 0);
  const s = getTimes(noon, LODZ.lat, LODZ.lon);
  return {
    sunrise: s.sunrise?.getTime() ?? NaN,
    sunset: s.sunset?.getTime() ?? NaN,
  };
}

export function timeOfDay(t: number): TimeOfDay {
  const { sunrise, sunset } = sunTimes(t);
  if (Math.abs(t - sunrise) <= HOUR) return 'dawn';
  if (Math.abs(t - sunset) <= HOUR) return 'dusk';
  if (t > sunrise && t < sunset) return 'day';
  return 'night';
}

export function lastNight(now: number): { sunset: number; sunrise: number } {
  const today = sunTimes(now);
  if (now > today.sunrise) {
    const yesterday = sunTimes(now - 24 * HOUR);
    return { sunset: yesterday.sunset, sunrise: today.sunrise };
  }
  const yesterday = sunTimes(now - 24 * HOUR);
  return { sunset: yesterday.sunset, sunrise: Math.min(today.sunrise, now) };
}

export const TOD_WORDS: Record<TimeOfDay, string> = {
  dawn: 'at dawn',
  day: 'in daylight',
  dusk: 'at dusk',
  night: 'after dark',
};

export function todColor(tod: TimeOfDay): string {
  if (tod === 'dawn' || tod === 'dusk') return '#D9775F';
  if (tod === 'day') return '#E6DDB8';
  return '#8CCBA4';
}

export function hourTod(hour: number, now = Date.now()): TimeOfDay {
  const offset = (localHour(now) - new Date(now).getUTCHours() + 24) % 24;
  const day = new Date(now);
  const utcHour = (hour - offset + 24) % 24;
  return timeOfDay(
    Date.UTC(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      utcHour,
      30,
    ),
  );
}

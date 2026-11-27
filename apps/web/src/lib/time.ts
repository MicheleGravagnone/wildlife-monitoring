export const TZ = 'Europe/Warsaw';

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const timeSecFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const dayFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  month: 'short',
  day: 'numeric',
});
const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const hourFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  hourCycle: 'h23',
});

type When = string | number | Date;
const d = (t: When) => (t instanceof Date ? t : new Date(t));

export const fmtTime = (t: When) => timeFmt.format(d(t));
export const fmtTimeSec = (t: When) => timeSecFmt.format(d(t));
export const fmtDay = (t: When) => {
  const parts = dayFmt.formatToParts(d(t));
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${month} ${day}`;
};
export const fmtDate = (t: When) => dateFmt.format(d(t));
export const fmtDateTime = (t: When) => `${fmtDate(t)} ${fmtTime(t)}`;
export const localHour = (t: When) => Number(hourFmt.format(d(t))) % 24;

export const pad2 = (n: number) => String(n).padStart(2, '0');

export function ago(now: number, t: When, suffix = ' ago'): string {
  const s = Math.max(0, Math.floor((now - d(t).getTime()) / 1000));
  if (s < 60) return suffix === ' ago' ? `${s} s ago` : 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${suffix}`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${m % 60} min${suffix}`;
  return `${Math.floor(h / 24)} days${suffix}`;
}

export function duration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)} m`;
}

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export type Range = '24h' | '7d' | '30d';
export const RANGE_HOURS: Record<Range, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
};
export const RANGE_WORDS: Record<Range, string> = {
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days',
};

export function rangeFrom(range: Range, now = Date.now()): string {
  const t = now - RANGE_HOURS[range] * HOUR;
  return new Date(Math.floor(t / 60000) * 60000).toISOString();
}

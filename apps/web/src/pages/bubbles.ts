import type {
  AnyDetection,
  HourlyActivity,
  ParkStats,
  SpeciesStats,
} from '../api/types';
import { isStaffDetection } from '../api/types';
import type { BubbleContent } from '../components/Bubble';
import { statusText } from '../components/ui';
import { shortPark } from '../lib/parks';
import { NEUTRAL_COLOR, speciesFor } from '../lib/species';
import { hourTod, todColor } from '../lib/sun';
import { ago, fmtDay, fmtTime, pad2 } from '../lib/time';

export const hourBars = (hourly: number[]) =>
  hourly.map((value, h) => ({ value, color: todColor(hourTod(h)) }));

const speciesList = (items: { speciesLabel: string; sightings: number }[]) =>
  items.map((s) => ({
    label: s.speciesLabel,
    value: s.sightings,
    photo: speciesFor(s.speciesLabel)?.photo,
  }));

export function speciesBubble(
  s: SpeciesStats | undefined,
  label: string,
  rangeLower: string,
): BubbleContent {
  const sp = speciesFor(label);
  if (!s) {
    return {
      title: label,
      sub: sp?.latin,
      color: sp?.color,
      big: 0,
      bigLabel: `sightings · ${rangeLower}`,
      note: sp?.note,
    };
  }
  const peak = s.hourly.indexOf(Math.max(...s.hourly));
  return {
    title: label,
    sub: sp?.latin,
    color: sp?.color,
    big: s.sightings,
    bigLabel: `sightings · ${rangeLower}`,
    bars: hourBars(s.hourly),
    rows: [
      { k: 'Most active', v: `${pad2(peak)}:00 · ${hourTod(peak)}` },
      { k: 'Favourite park', v: shortPark(s.topPark) },
    ],
    note: sp?.note,
  };
}

export function parkBubble(
  p: ParkStats | undefined,
  name: string,
  rangeLower: string,
  now: number,
): BubbleContent {
  return {
    title: name,
    sub: `${p?.species.length ?? 0} species · ${rangeLower}`,
    big: p?.sightings ?? 0,
    bigLabel: 'sightings',
    list: speciesList((p?.species ?? []).slice(0, 3)),
    rows: [
      { k: 'Last seen', v: p?.lastSpeciesLabel ?? '—' },
      { k: 'When', v: p?.lastSightingAt ? ago(now, p.lastSightingAt) : '—' },
    ],
    hint: 'CLICK TO OPEN IN THE JOURNAL',
  };
}

export function hourBubble(
  h: number,
  hourly: HourlyActivity | undefined,
  species: SpeciesStats[] | undefined,
): BubbleContent {
  const top = (species ?? [])
    .map((s) => ({ speciesLabel: s.speciesLabel, sightings: s.hourly[h] }))
    .filter((s) => s.sightings > 0)
    .sort((a, b) => b.sightings - a.sightings)
    .slice(0, 3);
  return {
    title: `${pad2(h)}:00 – ${pad2((h + 1) % 24)}:00`,
    sub: `local time · ${hourTod(h)}`,
    color: todColor(hourTod(h)),
    big: hourly?.buckets[h]?.sightings ?? 0,
    bigLabel: 'sightings in this hour',
    list: speciesList(top),
  };
}

export function detectionBubble(d: AnyDetection, live = false): BubbleContent {
  const label =
    d.speciesLabel ||
    (isStaffDetection(d) && d.classificationStatus === 'UNKNOWN'
      ? 'Unknown animal'
      : 'No animal');
  const sp = speciesFor(d.speciesLabel);
  const when = `${fmtDay(d.capturedAt)} ${fmtTime(d.capturedAt)}`;
  return {
    title: label,
    sub:
      sp?.latin ??
      (isStaffDetection(d) ? statusText(d.classificationStatus) : undefined),
    color: sp?.color ?? NEUTRAL_COLOR,
    photo: sp?.photo,
    rows: isStaffDetection(d)
      ? [
          { k: 'Park', v: d.parkName },
          { k: 'Camera', v: d.deviceId },
          { k: 'Captured', v: when },
          {
            k: 'Score',
            v: d.confidence != null ? d.confidence.toFixed(2) : '—',
          },
        ]
      : [
          { k: 'Near', v: d.parkName },
          { k: 'Captured', v: when },
        ],
    hint: live ? 'CLICK TO OPEN THE 3D WINDOW' : 'CLICK FOR THE FULL RECORD',
  };
}

export function labelOf(d: AnyDetection): string {
  if (d.speciesLabel) return d.speciesLabel;
  return isStaffDetection(d) && d.classificationStatus === 'UNKNOWN'
    ? 'Unknown animal'
    : 'No animal';
}

export function subLabelOf(d: AnyDetection, long = false): string {
  const sp = speciesFor(d.speciesLabel);
  if (sp) return sp.latin;
  if (isStaffDetection(d) && d.classificationStatus === 'UNKNOWN')
    return long ? 'Below species threshold' : 'below species threshold';
  return long ? 'Motion trigger, empty frame' : 'empty frame';
}

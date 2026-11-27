import { PARKS } from './parks';
import { mkRng } from './rng';

export const MAP_SIZE = 900;

export function project(lat: number, lon: number): { x: number; y: number } {
  return { x: ((lon - 19.36) / 0.2) * 900, y: ((51.85 - lat) / 0.12) * 900 };
}

const pathOf = (pts: [number, number][]) =>
  pts
    .map((p, i) => {
      const q = project(p[0], p[1]);
      return `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    })
    .join(' ');

const NS = [19.44, 19.447, 19.452, 19.4565, 19.461, 19.466, 19.472];
const EW = [
  51.783, 51.7795, 51.776, 51.772, 51.768, 51.764, 51.7595, 51.755, 51.751,
  51.747,
];

export const outline =
  pathOf([
    [51.845, 19.4],
    [51.85, 19.47],
    [51.84, 19.53],
    [51.8, 19.555],
    [51.76, 19.56],
    [51.735, 19.53],
    [51.73, 19.46],
    [51.735, 19.395],
    [51.76, 19.365],
    [51.8, 19.37],
    [51.83, 19.38],
    [51.845, 19.4],
  ]) + ' Z';

export const river = pathOf([
  [51.812, 19.385],
  [51.807, 19.42],
  [51.805, 19.445],
  [51.803, 19.47],
  [51.8, 19.5],
  [51.797, 19.535],
]);

export const streets = [
  ...NS.map((lon) =>
    pathOf([
      [51.783, lon],
      [51.747, lon + 0.0008],
    ]),
  ),
  ...EW.map((lat) =>
    pathOf([
      [lat, 19.44],
      [lat, 19.472],
    ]),
  ),
];

const ROADS: { pts: [number, number][]; hi?: boolean }[] = [
  {
    pts: [
      [51.7795, 19.4555],
      [51.7465, 19.4605],
    ],
    hi: true,
  },
  {
    pts: [
      [51.761, 19.37],
      [51.759, 19.43],
      [51.7595, 19.47],
      [51.758, 19.55],
    ],
  },
  {
    pts: [
      [51.82, 19.43],
      [51.78, 19.432],
      [51.74, 19.432],
    ],
  },
  {
    pts: [
      [51.779, 19.456],
      [51.81, 19.44],
      [51.845, 19.41],
    ],
  },
  {
    pts: [
      [51.779, 19.456],
      [51.81, 19.48],
      [51.84, 19.53],
    ],
  },
  {
    pts: [
      [51.757, 19.49],
      [51.748, 19.555],
    ],
  },
  {
    pts: [
      [51.746, 19.46],
      [51.735, 19.42],
    ],
  },
  {
    pts: [
      [51.79, 19.49],
      [51.74, 19.49],
    ],
  },
];

export const roads = ROADS.map((r) => ({
  d: pathOf(r.pts),
  stroke: r.hi ? '#8C4A3A' : '#25402F',
  width: r.hi ? 3.5 : 2.4,
}));

export const labels = (
  [
    ['ŚRÓDMIEŚCIE', 51.789, 19.462],
    ['BAŁUTY', 51.797, 19.41],
    ['WIDZEW', 51.772, 19.53],
    ['GÓRNA', 51.738, 19.475],
    ['POLESIE', 51.776, 19.395],
    ['ŁAGIEWNIKI', 51.8455, 19.47],
  ] as const
).map(([t, lat, lon]) => ({ t, ...project(lat, lon) }));

export const parkShapes = PARKS.map((p) => ({
  name: p.name,
  rx: p.rx,
  ry: p.ry,
  ...project(p.lat, p.lon),
}));

export const trees = (() => {
  const r = mkRng(3131);
  const out: { x: number; y: number; r: number }[] = [];
  for (const p of parkShapes) {
    const n = Math.max(2, Math.min(16, Math.round((p.rx * p.ry) / 650)));
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * 0.82;
      r();
      const s = 12 + r() * 12;
      r();
      out.push({
        x: p.x + Math.cos(a) * p.rx * rad,
        y: p.y + Math.sin(a) * p.ry * rad,
        r: s / 3.2,
      });
    }
  }
  return out;
})();

export const buildings = (() => {
  const r = mkRng(20261119);
  const out: { x: number; y: number; w: number; d: number }[] = [];
  for (let a = 0; a < NS.length - 1; a++) {
    for (let b = 0; b < EW.length - 1; b++) {
      const p1 = project(EW[b], NS[a]);
      const p2 = project(EW[b + 1], NS[a + 1]);
      const x = p1.x + 2.2;
      const y = p1.y + 2.2;
      const w = p2.x - p1.x - 4.4;
      const d = p2.y - p1.y - 4.4;
      if (w < 6 || d < 6) continue;
      out.push({ x, y, w: w * 0.42, d });
      out.push({ x: x + w * 0.58, y, w: w * 0.42, d });
      if (r() > 0.45) out.push({ x: x + w * 0.42, y, w: w * 0.16, d: d * 0.3 });
    }
  }
  return out;
})();

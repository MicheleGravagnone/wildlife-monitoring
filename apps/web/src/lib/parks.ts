export interface Park {
  name: string;
  slug: string;
  lat: number;
  lon: number;
  rx: number;
  ry: number;
  photo: string;
  crowns: string;
  credit: string;
}

const img = (slug: string) => ({
  photo: `/assets/pk-${slug}.jpg`,
  crowns: `/assets/pk-${slug}-crowns.webp`,
});

export const PARKS: Park[] = [
  {
    name: 'Las Łagiewnicki',
    slug: 'lag',
    lat: 51.8335,
    lon: 19.477,
    rx: 135,
    ry: 80,
    ...img('lag'),
    credit: 'Blackrainbow000 · CC BY-SA 3.0 PL',
  },
  {
    name: 'Arturówek',
    slug: 'art',
    lat: 51.8262,
    lon: 19.514,
    rx: 30,
    ry: 22,
    ...img('art'),
    credit: 'Jaruh Art · CC BY-SA 3.0 PL',
  },
  {
    name: 'Park na Zdrowiu',
    slug: 'zdr',
    lat: 51.7635,
    lon: 19.412,
    rx: 70,
    ry: 44,
    ...img('zdr'),
    credit: 'Darekm135 · CC BY-SA 3.0',
  },
  {
    name: 'Ogród Botaniczny',
    slug: 'bot',
    lat: 51.7555,
    lon: 19.401,
    rx: 26,
    ry: 20,
    ...img('bot'),
    credit: 'Darekm135 · CC BY-SA 3.0',
  },
  {
    name: 'Park Julianowski',
    slug: 'jul',
    lat: 51.806,
    lon: 19.445,
    rx: 26,
    ry: 17,
    ...img('jul'),
    credit: 'Darek Sołtysiński · CC BY-SA 3.0',
  },
  {
    name: 'Park Helenów',
    slug: 'hel',
    lat: 51.7835,
    lon: 19.464,
    rx: 14,
    ry: 12,
    ...img('hel'),
    credit: 'Piastu · CC BY-SA 4.0',
  },
  {
    name: 'Park Staromiejski',
    slug: 'sta',
    lat: 51.779,
    lon: 19.454,
    rx: 18,
    ry: 10,
    ...img('sta'),
    credit: 'Аимаина хикари · CC0',
  },
  {
    name: 'Park Źródliska',
    slug: 'zro',
    lat: 51.7598,
    lon: 19.4745,
    rx: 22,
    ry: 14,
    ...img('zro'),
    credit: 'Stevenlodz · CC BY-SA 4.0',
  },
  {
    name: 'Park Poniatowskiego',
    slug: 'pon',
    lat: 51.752,
    lon: 19.439,
    rx: 26,
    ry: 20,
    ...img('pon'),
    credit: 'Darekm135 · CC BY-SA 4.0',
  },
  {
    name: 'Park im. 3 Maja',
    slug: 'maj',
    lat: 51.7605,
    lon: 19.504,
    rx: 24,
    ry: 18,
    ...img('maj'),
    credit: 'Rakoon · CC0',
  },
];

export const ALL_PARKS_ART = {
  photo: '/assets/hero-forest.jpg',
  crowns: '/assets/hero-crowns.webp',
  credit: 'Marcinjozwiak · CC BY-SA 4.0',
};

const byName = new Map(PARKS.map((p) => [p.name, p]));

export function parkFor(name: string | null | undefined): Park | undefined {
  return name ? byName.get(name) : undefined;
}

export function shortPark(name: string): string {
  return name.replace(/^Park (im\. )?/, (m) =>
    m.includes('im.') ? 'im. ' : '',
  );
}

export type Activity = 'day' | 'crep' | 'crepnoc' | 'noc';

export interface Species {
  key: string;
  label: string;
  latin: string;
  color: string;
  pos: string;
  alt: string;
  act: Activity;
  note: string;
  photo: string;
}

const photo = (key: string) => `/assets/sp-${key}.jpg`;

export const SPECIES: Species[] = [
  {
    key: 'fox',
    label: 'Red fox',
    latin: 'Vulpes vulpes',
    color: '#E8A07A',
    pos: '60% 45%',
    alt: 'A red fox standing in snow',
    act: 'crepnoc',
    note: 'Mostly nocturnal and crepuscular; one of the most adaptable mammals in city parks.',
    photo: photo('fox'),
  },
  {
    key: 'deer',
    label: 'Roe deer',
    latin: 'Capreolus capreolus',
    color: '#D2B48C',
    pos: '50% 35%',
    alt: 'A roe deer buck facing the camera in a field',
    act: 'crep',
    note: 'Most active at dawn and dusk; browses along woodland edges and clearings.',
    photo: photo('deer'),
  },
  {
    key: 'squirrel',
    label: 'Red squirrel',
    latin: 'Sciurus vulgaris',
    color: '#E07F62',
    pos: '62% 40%',
    alt: 'A red squirrel eating on a feeder',
    act: 'day',
    note: 'Diurnal and arboreal; caches seeds and nuts through the autumn.',
    photo: photo('squirrel'),
  },
  {
    key: 'hedgehog',
    label: 'European hedgehog',
    latin: 'Erinaceus europaeus',
    color: '#C9B8D8',
    pos: '50% 55%',
    alt: 'A European hedgehog on grass',
    act: 'noc',
    note: 'Nocturnal forager; usually hibernates from late autumn until spring.',
    photo: photo('hedgehog'),
  },
  {
    key: 'boar',
    label: 'Wild boar',
    latin: 'Sus scrofa',
    color: '#9DB5C8',
    pos: '50% 50%',
    alt: 'A young wild boar in a forest clearing',
    act: 'noc',
    note: 'Largely nocturnal; forages in family groups called sounders.',
    photo: photo('boar'),
  },
  {
    key: 'badger',
    label: 'European badger',
    latin: 'Meles meles',
    color: '#E2DCCB',
    pos: '35% 45%',
    alt: 'A European badger by the water',
    act: 'noc',
    note: 'Nocturnal; lives in extended underground setts in woodland.',
    photo: photo('badger'),
  },
  {
    key: 'marten',
    label: 'Stone marten',
    latin: 'Martes foina',
    color: '#9FD3B2',
    pos: '35% 50%',
    alt: 'A stone marten among roots',
    act: 'noc',
    note: 'Nocturnal; often shelters in buildings, sheds and gardens.',
    photo: photo('marten'),
  },
  {
    key: 'hare',
    label: 'European hare',
    latin: 'Lepus europaeus',
    color: '#E6D08F',
    pos: '40% 55%',
    alt: 'A European hare sitting in grass',
    act: 'crep',
    note: 'Crepuscular; prefers open meadows and field margins.',
    photo: photo('hare'),
  },
];

const byLabel = new Map(SPECIES.map((s) => [s.label, s]));
const byKey = new Map(SPECIES.map((s) => [s.key, s]));

export function speciesFor(
  label: string | null | undefined,
): Species | undefined {
  return label ? byLabel.get(label) : undefined;
}

export function speciesByKey(key: string): Species | undefined {
  return byKey.get(key);
}

export const NEUTRAL_COLOR = '#8DA597';

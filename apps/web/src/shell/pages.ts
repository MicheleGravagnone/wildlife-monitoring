export type PageKey = 'overview' | 'journal' | 'sensors' | 'system';

export const PAGE_ORDER: PageKey[] = [
  'overview',
  'journal',
  'sensors',
  'system',
];

export function pageForPath(pathname: string): PageKey {
  const seg = pathname.split('/')[1] ?? '';
  return (PAGE_ORDER as string[]).includes(seg) ? (seg as PageKey) : 'overview';
}

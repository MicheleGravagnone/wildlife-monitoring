export function mkRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T>(
  r: () => number,
  items: T[],
  weight: (t: T) => number,
): T {
  let total = 0;
  for (const it of items) total += weight(it);
  let x = r() * total;
  for (const it of items) {
    x -= weight(it);
    if (x <= 0) return it;
  }
  return items[items.length - 1];
}

export function rngUuid(r: () => number): string {
  let s = '';
  for (let i = 0; i < 32; i++) s += Math.floor(r() * 16).toString(16);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-a${s.slice(17, 20)}-${s.slice(20, 32)}`;
}

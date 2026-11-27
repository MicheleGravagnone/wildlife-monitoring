export interface ChromeFit {
  islandCompact: boolean;
  cornersCompact: boolean;
}

export const ISLAND_WIDTH = {
  staff: { full: 560, compact: 324 },
  visitor: { full: 240, compact: 116 },
};

const BRAND = { full: 292, compact: 100 };
const ACCOUNT = {
  staff: { full: 235, compact: 150 },
  visitor: { full: 165, compact: 100 },
};
const GAP = 20;

export function fitChrome(
  width: number,
  staff: boolean,
  onLanding: boolean,
): ChromeFit {
  const who = staff ? 'staff' : 'visitor';
  const inset = onLanding ? 62 : 40;
  const fits = (islandCompact: boolean, cornersCompact: boolean) => {
    const island = ISLAND_WIDTH[who][islandCompact ? 'compact' : 'full'];
    const corner = Math.max(
      BRAND[cornersCompact ? 'compact' : 'full'],
      ACCOUNT[who][cornersCompact ? 'compact' : 'full'],
    );
    return width >= island + 2 * (inset + corner + GAP);
  };
  if (fits(false, false))
    return { islandCompact: false, cornersCompact: false };
  if (fits(true, false)) return { islandCompact: true, cornersCompact: false };
  return { islandCompact: true, cornersCompact: true };
}

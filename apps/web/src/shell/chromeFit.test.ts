import { describe, expect, it } from 'vitest';
import { fitChrome } from './chromeFit';

describe('fitChrome', () => {
  it('keeps everything full size on a large desktop', () => {
    expect(fitChrome(1440, true, true)).toEqual({
      islandCompact: false,
      cornersCompact: false,
    });
    expect(fitChrome(1440, false, true)).toEqual({
      islandCompact: false,
      cornersCompact: false,
    });
  });

  it('compacts the staff island first on a small laptop', () => {
    expect(fitChrome(1180, true, false)).toEqual({
      islandCompact: true,
      cornersCompact: false,
    });
  });

  it('lets visitors keep tab labels longer, as their island is shorter', () => {
    expect(fitChrome(1100, false, false).islandCompact).toBe(false);
  });

  it('shrinks the corners too on a tablet', () => {
    expect(fitChrome(800, true, true)).toEqual({
      islandCompact: true,
      cornersCompact: true,
    });
  });
});

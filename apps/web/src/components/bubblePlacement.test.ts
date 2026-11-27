import { describe, expect, it } from 'vitest';
import { placeBubble } from './bubblePlacement';

describe('placeBubble', () => {
  it('sits above a target with room above it', () => {
    const p = placeBubble(
      { left: 500, top: 600, width: 40, bottom: 640 },
      1440,
      145,
    );
    expect(p).toEqual({ x: 520, y: 586, below: false, tail: 0 });
  });

  it('flips below a target near the top of the screen', () => {
    const p = placeBubble(
      { left: 500, top: 100, width: 40, bottom: 140 },
      1440,
      145,
    );
    expect(p.below).toBe(true);
    expect(p.y).toBe(154);
  });

  it('stays inside the viewport and bends the tail towards the target', () => {
    const p = placeBubble(
      { left: 0, top: 600, width: 20, bottom: 620 },
      390,
      130,
    );
    expect(p.x).toBe(138);
    expect(p.tail).toBe(-106);
  });
});

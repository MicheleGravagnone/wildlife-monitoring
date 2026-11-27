export interface Rect {
  left: number;
  top: number;
  width: number;
  bottom: number;
}

export interface Placement {
  x: number;
  y: number;
  below: boolean;
  tail: number;
}

export function placeBubble(
  r: Rect,
  viewportWidth: number,
  halfWidth: number,
): Placement {
  const cx = r.left + r.width / 2;
  const x = Math.max(
    halfWidth + 8,
    Math.min(viewportWidth - halfWidth - 8, cx),
  );
  const below = r.top < 340;
  return {
    x,
    y: below ? r.bottom + 14 : r.top - 14,
    below,
    tail: Math.max(-halfWidth + 24, Math.min(halfWidth - 24, cx - x)),
  };
}

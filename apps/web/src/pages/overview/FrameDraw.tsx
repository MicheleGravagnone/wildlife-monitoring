import { useLayoutEffect, useRef, useState } from 'react';

export function FrameDraw({
  thickness,
  radius,
  duration,
  onDone,
}: {
  thickness: number;
  radius: number;
  duration: number;
  onDone: () => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, []);

  const s = thickness / 2;
  const r = Math.max(0, radius - s);
  const paths = size
    ? (() => {
        const { w, h } = size;
        const mid = w / 2;
        const right = `M${mid},${s} H${w - s - r} A${r},${r} 0 0 1 ${w - s},${s + r} V${h - s - r} A${r},${r} 0 0 1 ${w - s - r},${h - s} H${mid}`;
        const left = `M${mid},${s} H${s + r} A${r},${r} 0 0 0 ${s},${s + r} V${h - s - r} A${r},${r} 0 0 0 ${s + r},${h - s} H${mid}`;
        return [right, left];
      })()
    : [];

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      width={size?.w ?? 0}
      height={size?.h ?? 0}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1,
      }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          fill="none"
          stroke="var(--frame)"
          strokeWidth={thickness}
          strokeLinecap="butt"
          className="wm-frame-draw"
          style={{ animationDuration: `${duration}ms` }}
          onAnimationEnd={i === 0 ? onDone : undefined}
        />
      ))}
    </svg>
  );
}

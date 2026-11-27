import type { CSSProperties, ReactNode } from 'react';
import type { ClassificationStatus, SensorStatus } from '../api/types';

export function Chip({
  on,
  light = false,
  onClick,
  children,
  style,
}: {
  on: boolean;
  light?: boolean;
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const colors = light
    ? on
      ? { background: '#0B1711', color: '#F2F1EC', border: '1px solid #0B1711' }
      : {
          background: 'transparent',
          color: '#0B1711',
          border: '1px solid rgba(11,23,17,0.25)',
        }
    : on
      ? { background: '#BEE3C9', color: '#0B1711', border: '1px solid #BEE3C9' }
      : {
          background: 'transparent',
          color: '#E7F0EA',
          border: '1px solid rgba(190,227,201,0.22)',
        };
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 38,
        padding: '0 15px',
        borderRadius: 999,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        transition: 'background .25s, color .25s',
        ...colors,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const STATUS_CHIP: Record<ClassificationStatus, CSSProperties> = {
  IDENTIFIED: { background: 'rgba(190,227,201,0.16)', color: '#BEE3C9' },
  UNKNOWN: { background: 'rgba(230,208,143,0.16)', color: '#E6D08F' },
  NO_ANIMAL: { background: 'rgba(224,128,106,0.18)', color: '#F0A898' },
};

export function statusText(s: ClassificationStatus): string {
  return s.replace('_', ' ').toLowerCase();
}

export function StatusChip({ status }: { status: ClassificationStatus }) {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '.08em',
        padding: '4px 9px',
        borderRadius: 999,
        textTransform: 'uppercase',
        ...STATUS_CHIP[status],
      }}
    >
      {statusText(status)}
    </span>
  );
}

export const SENSOR_STATUS: Record<
  SensorStatus,
  { label: string; fg: string; bg: string; dot: string }
> = {
  online: {
    label: 'Online',
    fg: '#BEE3C9',
    bg: 'rgba(190,227,201,0.12)',
    dot: '#8CCBA4',
  },
  attention: {
    label: 'Needs attention',
    fg: '#E6D08F',
    bg: 'rgba(230,208,143,0.14)',
    dot: '#D9B95E',
  },
  offline: {
    label: 'Offline',
    fg: '#F0A898',
    bg: 'rgba(181,65,47,0.2)',
    dot: '#E0806A',
  },
  unknown: {
    label: 'No telemetry',
    fg: '#B9CBBF',
    bg: 'rgba(231,240,234,0.08)',
    dot: '#7F9688',
  },
};

export function SensorPill({
  status,
  style,
}: {
  status: SensorStatus;
  style?: CSSProperties;
}) {
  const m = SENSOR_STATUS[status];
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        background: m.bg,
        color: m.fg,
        ...style,
      }}
    >
      <span
        style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot }}
      />
      {m.label}
    </span>
  );
}

export function Sparkline({
  values,
  width = 240,
  height = 50,
  low = false,
  stroke = 2,
}: {
  values: (number | null)[];
  width?: number;
  height?: number;
  low?: boolean;
  stroke?: number;
}) {
  const pts = values
    .map((v, i) =>
      v == null
        ? null
        : [
            (i / (values.length - 1)) * width,
            height - 3 - (v / 100) * (height - 6),
          ],
    )
    .filter((p): p is number[] => p !== null);
  if (pts.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ width: '100%', height }}
      >
        <line
          x1="0"
          x2={width}
          y1={height - 4}
          y2={height - 4}
          stroke="rgba(190,227,201,0.18)"
          strokeDasharray="4 5"
        />
      </svg>
    );
  }
  const line = pts
    .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ');
  const area = `M${pts[0][0].toFixed(1)} ${height} L${line.split(' ').join(' L')} L${pts[pts.length - 1][0].toFixed(1)} ${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ width: '100%', height }}
    >
      <path
        d={area}
        fill={low ? 'rgba(224,128,106,0.14)' : 'rgba(190,227,201,0.10)'}
      />
      <polyline
        points={line}
        fill="none"
        stroke={low ? '#E0806A' : '#BEE3C9'}
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Fields({
  fields,
  gap = 14,
}: {
  fields: { k: string; v: ReactNode }[];
  gap?: number | string;
}) {
  return (
    <dl
      style={{
        margin: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap,
      }}
    >
      {fields.map((x) => (
        <div
          key={x.k}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 0,
          }}
        >
          <dt
            style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
            }}
          >
            {x.k}
          </dt>
          <dd
            style={{
              margin: 0,
              fontFamily: 'var(--mono)',
              fontSize: 12,
              overflowWrap: 'anywhere',
            }}
          >
            {x.v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const eyebrow: CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.2em',
  color: 'var(--mint)',
};

export function LoadError({
  what,
  onRetry,
}: {
  what: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        padding: '18px 20px',
        borderRadius: 18,
        background: 'rgba(181,65,47,0.14)',
        border: '1px solid rgba(224,128,106,0.35)',
        color: '#F6C7BC',
        fontSize: 13,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span>Couldn’t load {what}.</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            border: 0,
            background: 'transparent',
            color: 'var(--mint)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

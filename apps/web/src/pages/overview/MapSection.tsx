import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import { useBubbleProps } from '../../components/Bubble';
import { Loader } from '../../components/Loader';
import { eyebrow } from '../../components/ui';
import { useIsMobile } from '../../lib/hooks';
import {
  buildings,
  labels,
  outline,
  parkShapes,
  river,
  roads,
  streets,
  trees,
} from '../../lib/lodzMap';
import { parkBubble } from '../bubbles';
import { h2Style, type OverviewData } from './Overview';

const HeatMap = lazy(() => import('./HeatMap'));

export function MapSection({ data }: { data: OverviewData }) {
  const mobile = useIsMobile();
  const navigate = useNavigate();
  const parks = data.parks ?? [];
  const count = (name: string) =>
    parks.find((p) => p.parkName === name)?.sightings ?? 0;
  const max = Math.max(1, ...parks.map((p) => p.sightings));
  const toJournal = (name: string) =>
    navigate(`/journal?park=${encodeURIComponent(name)}`);
  const top6 = [...parks].sort((a, b) => b.sightings - a.sightings).slice(0, 6);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '40px 56px',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          flex: '1.6 1 520px',
          minWidth: 0,
          padding: 8,
          borderRadius: 30,
          background: 'var(--cream)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            maxHeight: 760,
            borderRadius: 24,
            overflow: 'hidden',
            background: '#0E1F16',
          }}
        >
          <NearViewport>
            <Suspense
              fallback={<Loader overlay size={64} label="Loading the map" />}
            >
              <HeatMap
                parks={data.parks}
                bubble={(name) =>
                  parkBubble(
                    parks.find((q) => q.parkName === name),
                    name,
                    data.rangeLower,
                    data.now,
                  )
                }
                onPick={toJournal}
                fallback={
                  <SchematicMap
                    data={data}
                    count={count}
                    max={max}
                    toJournal={toJournal}
                  />
                }
              />
            </Suspense>
          </NearViewport>
          <span
            style={{
              position: 'absolute',
              left: 16,
              bottom: 14,
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              pointerEvents: 'none',
            }}
          >
            HEAT BY PARK · {data.rangeLower.toUpperCase()}
          </span>
        </div>
      </div>
      <div
        style={{
          flex: '1 1 300px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          paddingTop: mobile ? 0 : 40,
        }}
      >
        <span style={eyebrow}>02 — WHERE THEY MOVE</span>
        <h2 style={h2Style(mobile)}>
          Ten green
          <br />
          islands in
          <br />
          <span
            style={{
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'var(--mint)',
            }}
          >
            a city of brick
          </span>
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.7,
            color: 'var(--body)',
            maxWidth: 380,
          }}
        >
          The glow follows the animals. Hover a park on the map, or a name
          below, to see who has been passing through.
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid var(--hairline)',
          }}
        >
          {top6.map((p) => (
            <ParkRow
              key={p.parkName}
              name={p.parkName}
              sightings={p.sightings}
              bubble={() =>
                parkBubble(p, p.parkName, data.rangeLower, data.now)
              }
              onPick={() => toJournal(p.parkName)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Hotspot(p: {
  name: string;
  x: number;
  y: number;
  size: number;
  sightings: number;
  bubble: () => ReturnType<typeof parkBubble>;
  onPick: () => void;
}) {
  const bubble = useBubbleProps(p.bubble);
  return (
    <button
      type="button"
      className="wm-hot"
      onClick={p.onPick}
      {...bubble}
      aria-label={`${p.name}: ${p.sightings} sightings. Open in the journal`}
      style={{
        position: 'absolute',
        left: `${(p.x / 9).toFixed(2)}%`,
        top: `${(p.y / 9).toFixed(2)}%`,
        width: p.size,
        height: p.size,
        transform: 'translate(-50%,-50%)',
        borderRadius: '50%',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        background:
          'radial-gradient(circle, #F2F1EC 0 24%, rgba(190,227,201,0.6) 36%, rgba(190,227,201,0) 70%)',
      }}
    />
  );
}

function ParkRow(p: {
  name: string;
  sightings: number;
  bubble: () => ReturnType<typeof parkBubble>;
  onPick: () => void;
}) {
  const bubble = useBubbleProps(p.bubble);
  return (
    <button
      type="button"
      className="wm-parkrow"
      onClick={p.onPick}
      {...bubble}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        padding: '14px 0',
        border: 0,
        borderBottom: '1px solid rgba(190,227,201,0.12)',
        background: 'transparent',
        color: 'var(--text)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 18 }}>{p.name}</span>
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 12,
          color: 'var(--muted)',
        }}
      >
        {p.sightings} sightings
      </span>
    </button>
  );
}

function NearViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
      {near ? children : null}
    </div>
  );
}

function SchematicMap({
  data,
  count,
  max,
  toJournal,
}: {
  data: OverviewData;
  count: (name: string) => number;
  max: number;
  toJournal: (name: string) => void;
}) {
  const parks = data.parks ?? [];
  return (
    <>
      <svg
        viewBox="0 0 900 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <path
          d={outline}
          fill="#13281D"
          stroke="rgba(190,227,201,0.3)"
          strokeWidth="1.6"
          strokeDasharray="6 7"
        />
        {parkShapes.map((p) => (
          <ellipse
            key={p.name}
            cx={p.x}
            cy={p.y}
            rx={p.rx}
            ry={p.ry}
            fill="#1E4030"
            stroke="#2F5A44"
            strokeWidth="1.2"
          />
        ))}
        {trees.map((t, i) => (
          <circle
            key={i}
            cx={t.x.toFixed(1)}
            cy={t.y.toFixed(1)}
            r={t.r.toFixed(1)}
            fill="#2E5C44"
          />
        ))}
        <path
          d={river}
          fill="none"
          stroke="#4E7F86"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {streets.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#1C3226" strokeWidth="1.3" />
        ))}
        {roads.map((r, i) => (
          <path
            key={i}
            d={r.d}
            fill="none"
            stroke={r.stroke}
            strokeWidth={r.width}
            strokeLinecap="round"
          />
        ))}
        {buildings.map((b, i) => (
          <rect
            key={i}
            x={b.x.toFixed(1)}
            y={b.y.toFixed(1)}
            width={b.w.toFixed(1)}
            height={b.d.toFixed(1)}
            fill="#1A3024"
          />
        ))}
        {labels.map((l) => (
          <text
            key={l.t}
            x={l.x.toFixed(0)}
            y={l.y.toFixed(0)}
            fill="rgba(231,240,234,0.3)"
            fontFamily="JetBrains Mono, monospace"
            fontSize="14"
            letterSpacing="4"
            textAnchor="middle"
          >
            {l.t}
          </text>
        ))}
      </svg>
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}
      >
        {parkShapes.map((p) => {
          const k = Math.sqrt(count(p.name) / max);
          const size = 12 + k * 30;
          const a = 0.22 + k * 0.6;
          return (
            <div
              key={p.name}
              style={{
                position: 'absolute',
                left: `${(p.x / 9).toFixed(2)}%`,
                top: `${(p.y / 9).toFixed(2)}%`,
                width: `${size.toFixed(1)}%`,
                height: `${size.toFixed(1)}%`,
                transform: 'translate(-50%,-50%)',
                borderRadius: '50%',
                transition: 'width .8s var(--ios), height .8s var(--ios)',
                background: `radial-gradient(circle, rgba(226,244,231,${(a * 0.9).toFixed(2)}) 0%, rgba(190,227,201,${(a * 0.6).toFixed(2)}) 22%, rgba(120,190,150,${(a * 0.3).toFixed(2)}) 45%, rgba(120,190,150,0) 70%)`,
              }}
            />
          );
        })}
      </div>
      {parkShapes.map((p) => (
        <Hotspot
          key={p.name}
          name={p.name}
          x={p.x}
          y={p.y}
          size={14 + Math.sqrt(count(p.name) / max) * 16}
          sightings={count(p.name)}
          bubble={() =>
            parkBubble(
              parks.find((q) => q.parkName === p.name),
              p.name,
              data.rangeLower,
              data.now,
            )
          }
          onPick={() => toJournal(p.name)}
        />
      ))}
    </>
  );
}

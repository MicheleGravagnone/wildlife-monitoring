import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as RPointerEvent,
} from 'react';
import { useSearchParams } from 'react-router';
import { useImageUrl } from '../../api/hooks';
import type { Detection } from '../../api/types';
import { useBubbleProps } from '../../components/Bubble';
import { IconPause, IconPlay } from '../../components/icons';
import { Fields, StatusChip } from '../../components/ui';
import { useEscape, useIsMobile, useIsTablet, useNow } from '../../lib/hooks';
import { SPECIES, speciesFor } from '../../lib/species';
import { liveBadge } from '../../shell/Island';
import type { LivePhase } from '../../shell/Layout';
import { lastNight } from '../../lib/sun';
import {
  ago,
  fmtDate,
  fmtDay,
  fmtTime,
  fmtTimeSec,
  HOUR,
} from '../../lib/time';
import { detectionBubble, labelOf, subLabelOf } from '../bubbles';
import { LiveMap, type LiveMapHandle, type Pin } from './LiveMap';
import { useLiveSightings } from './useLiveSightings';

const LIVE_WINDOW = 6 * HOUR;
const REPLAY_WINDOW = HOUR;
const SPEEDS = [300, 900, 2700];
const glass: CSSProperties = {
  background: 'rgba(11,23,17,0.86)',
  border: '1px solid rgba(190,227,201,0.14)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

export default function Live({
  phase,
  onExit,
}: {
  phase: LivePhase;
  onExit: () => void;
}) {
  const mobile = useIsMobile();
  const tablet = useIsTablet();
  const now = useNow(1000);
  const [params] = useSearchParams();
  const mapRef = useRef<LiveMapHandle>(null);

  const night = useMemo(() => lastNight(Date.now()), []);
  const replayStart = night.sunset - 45 * 60_000;

  const [replay, setReplay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(replayStart);
  const [speed, setSpeed] = useState(900);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const replayRef = useRef(replay);
  replayRef.current = replay;

  useEffect(() => liveBadge.set({ newCount: 0 }), []);
  const onArrive = useCallback(() => {
    if (!replayRef.current)
      liveBadge.set({ newCount: liveBadge.get().newCount + 1 });
  }, []);
  const { items, status } = useLiveSightings(replayStart, onArrive);
  useEscape(phase === 'in' && !selectedId, onExit);
  useEscape(!!selectedId, () => setSelectedId(null));

  useEffect(() => {
    if (!replay || !playing) return;
    const t = setInterval(() => {
      setPlayhead((p) => {
        const next = p + speed * 100;
        if (next >= Date.now()) {
          setReplay(false);
          setPlaying(false);
          return p;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(t);
  }, [replay, playing, speed]);

  const focus = params.get('focus');
  const focused = useRef(false);
  useEffect(() => {
    if (!focus || focused.current || !items.length) return;
    const d = items.find((x) => x.id === focus);
    if (!d) return;
    focused.current = true;
    const t = Date.parse(d.capturedAt);
    if (Date.now() - t > LIVE_WINDOW) {
      setReplay(true);
      setPlaying(false);
      setPlayhead(t + 60_000);
    }
    setTimeout(() => setSelectedId(d.id), 400);
  }, [focus, items]);

  const viewT = replay ? playhead : now;
  const windowMs = replay ? REPLAY_WINDOW : LIVE_WINDOW;
  const visible = useMemo(
    () =>
      items
        .filter((x) => {
          const t = Date.parse(x.capturedAt);
          return t > viewT - windowMs && t <= viewT;
        })
        .reverse()
        .slice(0, 40),
    [items, viewT, windowMs],
  );
  const pins: Pin[] = visible.map((d, i) => {
    const age = Math.min(1, (viewT - Date.parse(d.capturedAt)) / windowMs);
    const fresh = !replay && now - Date.parse(d.capturedAt) < 25_000;
    return { d, age, fresh, showLabel: i < (mobile ? 1 : 3) || fresh };
  });
  const selected =
    visible.find((d) => d.id === selectedId) ??
    items.find((d) => d.id === selectedId) ??
    null;
  const nextSighting = () => {
    if (!visible.length) return;
    const i = visible.findIndex((d) => d.id === selectedId);
    setSelectedId(visible[(i + 1) % visible.length].id);
  };
  const prevSighting = () => {
    if (!visible.length) return;
    const i = visible.findIndex((d) => d.id === selectedId);
    setSelectedId(visible[(i - 1 + visible.length) % visible.length].id);
  };

  const ramp = 50 * 60_000;
  const nf =
    viewT >= night.sunset && viewT <= night.sunrise
      ? Math.min(
          Math.min(1, (viewT - night.sunset) / ramp),
          Math.min(1, (night.sunrise - viewT) / ramp),
        )
      : 0;
  const shown = phase === 'in';

  return (
    <section
      aria-label="Live sightings map"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        overflow: 'hidden',
        color: 'var(--text)',
        background: `radial-gradient(120% 90% at 50% 30%, ${nf > 0.5 ? '#0C1B13' : '#13281D'} 0%, #060D09 72%)`,
        clipPath: `circle(${shown ? '150%' : '0%'} at 50% ${mobile ? '100%' : '40px'})`,
        WebkitClipPath: `circle(${shown ? '150%' : '0%'} at 50% ${mobile ? '100%' : '40px'})`,
        transition:
          'clip-path 1.1s cubic-bezier(.77,0,.18,1), -webkit-clip-path 1.1s cubic-bezier(.77,0,.18,1), background 1s',
      }}
    >
      <LiveMap
        ref={mapRef}
        pins={pins}
        selectedId={selectedId}
        onSelect={setSelectedId}
        viewT={viewT}
        replay={replay}
        mobile={mobile}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: '#030806',
          transition: 'opacity .6s',
          opacity: replay ? nf * 0.42 : 0,
        }}
      />

      {mobile ? (
        <div
          style={{
            position: 'absolute',
            top: 76,
            left: 0,
            right: 0,
            zIndex: 5,
            display: 'flex',
            gap: 8,
            padding: '0 14px',
            overflowX: 'auto',
          }}
        >
          {visible.slice(0, 3).map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedId(d.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flex: 'none',
                minHeight: 44,
                padding: '4px 14px 4px 4px',
                borderRadius: 999,
                border: '1px solid rgba(190,227,201,0.16)',
                background: 'rgba(11,23,17,0.9)',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text)',
              }}
            >
              <Thumb d={d} size={36} round />
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {labelOf(d)}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    color: 'var(--muted)',
                  }}
                >
                  {ago(viewT, d.capturedAt, replay ? ' earlier' : ' ago')}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <Feed
            visible={visible}
            viewT={viewT}
            now={now}
            replay={replay}
            status={status}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          {!tablet && (
            <div
              aria-label="Species legend"
              style={{
                position: 'absolute',
                right: 24,
                bottom: 24,
                zIndex: 4,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '7px 16px',
                padding: '14px 16px',
                borderRadius: 22,
                ...glass,
              }}
            >
              {SPECIES.map((s) => (
                <span
                  key={s.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 11,
                    color: 'var(--body)',
                  }}
                >
                  <img
                    src={s.photo}
                    alt=""
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <CameraControls mobile={mobile} map={mapRef} />

      {!(mobile && selected) && (
        <Scrubber
          mobile={mobile}
          tablet={tablet}
          items={items}
          start={replayStart}
          now={now}
          night={night}
          viewT={viewT}
          nf={nf}
          replay={replay}
          playing={playing}
          speed={speed}
          onSpeed={setSpeed}
          onNow={() => {
            setReplay(false);
            setPlaying(false);
          }}
          onReplay={() => {
            setReplay(true);
            setPlaying(true);
            setPlayhead(replayStart);
            setSelectedId(null);
          }}
          onTogglePlay={() => {
            if (!replay) {
              setReplay(true);
              setPlaying(true);
              setPlayhead(replayStart);
              setSelectedId(null);
            } else setPlaying((p) => !p);
          }}
          onScrub={(t) => {
            if (t >= Date.now() - 60_000) {
              setReplay(false);
              setPlaying(false);
            } else {
              setReplay(true);
              setPlaying(false);
              setPlayhead(t);
            }
          }}
        />
      )}

      {selected && shown && (
        <DetailCard
          key={selected.id}
          d={selected}
          mobile={mobile}
          onClose={() => setSelectedId(null)}
          onNext={nextSighting}
          onPrev={prevSighting}
        />
      )}
    </section>
  );
}

function Thumb({
  d,
  size,
  round = false,
}: {
  d: Detection;
  size: number;
  round?: boolean;
}) {
  const sp = speciesFor(d.speciesLabel);
  const radius = round ? '50%' : '12px 12px 12px 3px';
  return sp ? (
    <img
      src={sp.photo}
      alt=""
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: 'cover',
        flex: 'none',
      }}
    />
  ) : (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flex: 'none',
        background: '#1A3024',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--muted)',
      }}
    >
      ?
    </span>
  );
}

function Feed({
  visible,
  viewT,
  now,
  replay,
  status,
  selectedId,
  onSelect,
}: {
  visible: Detection[];
  viewT: number;
  now: number;
  replay: boolean;
  status: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 100,
        left: 24,
        width: 300,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 18,
        borderRadius: 26,
        ...glass,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>
          {replay ? 'Replay' : 'Live feed'}
        </h2>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: replay ? '#E6D08F' : '#F0A898',
          }}
        >
          <span className="wm-livedot" />
          {replay
            ? 'last night'
            : status === 'polling'
              ? 'polling'
              : status === 'error'
                ? 'offline'
                : 'classified'}
        </span>
      </div>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
        All classified captures ·{' '}
        {replay ? `hour up to ${fmtTime(viewT)}` : 'last 6 hours'} ·{' '}
        {visible.length}
      </span>
      <ul
        aria-live="polite"
        aria-relevant="additions"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {visible.slice(0, 7).map((d) => (
          <li key={d.id}>
            <FeedRow
              d={d}
              viewT={viewT}
              replay={replay}
              fresh={!replay && now - Date.parse(d.capturedAt) < 25_000}
              selected={d.id === selectedId}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
      {!visible.length && (
        <span style={{ fontSize: 12, color: 'var(--muted)', padding: 8 }}>
          {replay ? 'No sightings in this hour.' : 'Quiet for now.'}
        </span>
      )}
    </div>
  );
}

function FeedRow({
  d,
  viewT,
  replay,
  fresh,
  selected,
  onSelect,
}: {
  d: Detection;
  viewT: number;
  replay: boolean;
  fresh: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const bubble = useBubbleProps(() => detectionBubble(d, true));
  return (
    <button
      type="button"
      className={fresh ? 'wm-new' : undefined}
      onClick={() => onSelect(d.id)}
      {...bubble}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        minHeight: 48,
        padding: '6px 8px',
        borderRadius: 16,
        border: 0,
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--text)',
        background: selected ? 'rgba(190,227,201,0.08)' : 'transparent',
      }}
    >
      <Thumb d={d} size={36} />
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flex: 1,
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500 }}>{labelOf(d)}</span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {d.parkName} · {d.deploymentName}
        </span>
      </span>
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--muted)',
        }}
      >
        {ago(viewT, d.capturedAt, replay ? ' earlier' : ' ago')}
      </span>
    </button>
  );
}

function CameraControls({
  mobile,
  map,
}: {
  mobile: boolean;
  map: React.RefObject<LiveMapHandle | null>;
}) {
  const btn: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--text)',
  };
  const icon = (d: string) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
  return (
    <div
      role="toolbar"
      aria-label="Camera"
      style={{
        position: 'absolute',
        zIndex: 6,
        display: 'flex',
        gap: 2,
        padding: 4,
        borderRadius: 999,
        ...glass,
        ...(mobile
          ? { flexDirection: 'column', right: 12, top: 136 }
          : { left: 24, bottom: 24 }),
      }}
    >
      <button
        type="button"
        aria-label="Orbit left"
        style={btn}
        onClick={() => map.current?.orbit(-30)}
      >
        {icon('M3 12a9 9 0 1 0 3-6.7M3 4v5h5')}
      </button>
      <button
        type="button"
        aria-label="Orbit right"
        style={btn}
        onClick={() => map.current?.orbit(30)}
      >
        {icon('M21 12a9 9 0 1 1-3-6.7M21 4v5h-5')}
      </button>
      {!mobile && (
        <>
          <button
            type="button"
            aria-label="Tilt flatter"
            style={btn}
            onClick={() => map.current?.tilt(-10)}
          >
            {icon('M4 18h16M7 14l5-8 5 8')}
          </button>
          <button
            type="button"
            aria-label="Tilt steeper"
            style={btn}
            onClick={() => map.current?.tilt(10)}
          >
            {icon('M3 17l6-4h12l-6 4zM9 13V6')}
          </button>
        </>
      )}
      <button
        type="button"
        aria-label="Zoom in"
        style={btn}
        onClick={() => map.current?.zoom(0.6)}
      >
        {icon('M12 5v14M5 12h14')}
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        style={btn}
        onClick={() => map.current?.zoom(-0.6)}
      >
        {icon('M5 12h14')}
      </button>
      <button
        type="button"
        aria-label="Reset camera"
        style={btn}
        onClick={() => map.current?.reset()}
      >
        {icon(
          'M12 2v4M12 18v4M2 12h4M18 12h4M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
        )}
      </button>
    </div>
  );
}

function Scrubber(p: {
  mobile: boolean;
  tablet: boolean;
  items: Detection[];
  start: number;
  now: number;
  night: { sunset: number; sunrise: number };
  viewT: number;
  nf: number;
  replay: boolean;
  playing: boolean;
  speed: number;
  onSpeed: (s: number) => void;
  onNow: () => void;
  onReplay: () => void;
  onTogglePlay: () => void;
  onScrub: (t: number) => void;
}) {
  const total = p.now - p.start;
  const pct = (t: number) =>
    Math.max(0, Math.min(100, ((t - p.start) / total) * 100));
  const binMs = (p.mobile ? 30 : 15) * 60_000;
  const nb = Math.ceil(total / binMs);
  const counts = Array.from({ length: nb }, () => 0);
  for (const x of p.items) {
    const t = Date.parse(x.capturedAt);
    if (t >= p.start && t <= p.now)
      counts[Math.min(nb - 1, Math.floor((t - p.start) / binMs))]++;
  }
  const maxB = Math.max(1, ...counts);
  const ticks: number[] = [];
  for (let t = p.start; t < p.now - 90 * 60_000; t += (p.mobile ? 4 : 3) * HOUR)
    ticks.push(t);
  const seg = (on: boolean, color: CSSProperties): CSSProperties => ({
    height: p.mobile ? 36 : 30,
    padding: '0 12px',
    borderRadius: 999,
    border: 0,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    ...(on ? color : { background: 'transparent', color: 'var(--muted)' }),
  });

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        padding: '12px 16px 9px',
        boxSizing: 'border-box',
        borderRadius: 24,
        ...glass,
        background: 'rgba(11,23,17,0.9)',
        ...(p.mobile
          ? { left: 12, right: 12, bottom: 84 }
          : p.tablet
            ? { left: 372, right: 24, bottom: 20 }
            : {
                left: '50%',
                bottom: 20,
                transform: 'translateX(-50%)',
                width: 'min(600px, calc(100% - 820px))',
                minWidth: 420,
              }),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          role="group"
          aria-label="Timeline mode"
          style={{
            display: 'flex',
            gap: 2,
            padding: 3,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <button
            type="button"
            aria-pressed={!p.replay}
            onClick={p.onNow}
            style={seg(!p.replay, {
              background: 'var(--terracotta)',
              color: '#fff',
            })}
          >
            Live
          </button>
          <button
            type="button"
            aria-pressed={p.replay}
            onClick={p.onReplay}
            style={seg(p.replay, {
              background: 'var(--cream)',
              color: 'var(--bg)',
            })}
          >
            {p.mobile ? 'Replay' : 'Replay night'}
          </button>
        </div>
        <button
          type="button"
          onClick={p.onTogglePlay}
          aria-label={
            p.playing && p.replay ? 'Pause replay' : 'Play replay of last night'
          }
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 0,
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--cream)',
            color: 'var(--bg)',
            flex: 'none',
          }}
        >
          {p.playing && p.replay ? <IconPause /> : <IconPlay />}
        </button>
        {!p.mobile && !p.tablet && (
          <div
            role="group"
            aria-label="Replay speed"
            style={{ display: 'flex', gap: 2 }}
          >
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={p.speed === s}
                onClick={() => p.onSpeed(s)}
                style={{
                  height: 30,
                  padding: '0 9px',
                  borderRadius: 999,
                  border: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  ...(p.speed === s
                    ? {
                        background: 'rgba(231,240,234,0.14)',
                        color: 'var(--text)',
                      }
                    : { background: 'transparent', color: 'var(--muted)' }),
                }}
              >
                {s / 60} min/s
              </button>
            ))}
          </div>
        )}
        <span style={{ flex: 1 }} />
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <span style={{ fontFamily: 'var(--mono)', fontSize: 16 }}>
            {p.replay ? fmtTime(p.viewT) : fmtTimeSec(p.viewT)}
          </span>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>
            {p.replay
              ? `${p.nf > 0.5 ? 'night' : p.nf > 0 ? 'twilight' : 'daylight'} · ${fmtDay(p.viewT)}`
              : `live · ${fmtDay(p.now)}`}
          </span>
        </span>
      </div>
      <div style={{ position: 'relative', height: 42 }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pct(p.night.sunset).toFixed(2)}%`,
            width: `${(pct(p.night.sunrise) - pct(p.night.sunset)).toFixed(2)}%`,
            borderRadius: 8,
            background: 'rgba(120,150,170,0.14)',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            padding: '0 2px',
          }}
        >
          {counts.map((c, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                borderRadius: '2px 2px 0 0',
                height: `${Math.max(6, (c / maxB) * 100).toFixed(1)}%`,
                background:
                  p.start + (i + 1) * binMs <= p.viewT
                    ? 'var(--mint)'
                    : 'rgba(231,240,234,0.2)',
              }}
            />
          ))}
        </div>
        <label htmlFor="wm-scrubber" className="sr-only">
          Replay time
        </label>
        <input
          id="wm-scrubber"
          className="wm-range"
          type="range"
          min={0}
          max={Math.floor(total / 60_000)}
          step={1}
          value={Math.floor((p.viewT - p.start) / 60_000)}
          aria-valuetext={fmtTime(p.viewT)}
          onChange={(e) => p.onScrub(p.start + Number(e.target.value) * 60_000)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: 42 }}
        />
      </div>
      <div
        style={{
          position: 'relative',
          height: 14,
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--muted)',
        }}
      >
        {ticks.map((t) => (
          <span
            key={t}
            style={{
              position: 'absolute',
              top: 0,
              left: `${pct(t).toFixed(2)}%`,
              transform: t === p.start ? 'none' : 'translateX(-50%)',
            }}
          >
            {fmtTime(t)}
          </span>
        ))}
        <span
          style={{ position: 'absolute', top: 0, right: 0, color: '#F0A898' }}
        >
          now
        </span>
      </div>
    </div>
  );
}

function DetailCard({
  d,
  mobile,
  onClose,
  onNext,
  onPrev,
}: {
  d: Detection;
  mobile: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const sp = speciesFor(d.speciesLabel);
  const image = useImageUrl(d.id, d.hasImage);
  const photo = image.data?.url ?? sp?.photo;
  const conf = d.confidence;

  const fields = [
    { k: 'Captured', v: fmtTimeSec(d.capturedAt) },
    {
      k: 'Classified',
      v: `+${((Date.parse(d.classifiedAt) - Date.parse(d.capturedAt)) / 1000).toFixed(1)} s`,
    },
    { k: 'Deployment', v: d.deploymentName },
    { k: 'Park', v: d.parkName },
    ...(mobile
      ? []
      : [
          {
            k: 'Location',
            v: `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`,
          },
          { k: 'Sensor', v: d.deviceId },
          { k: 'Model', v: d.modelVersion },
          { k: 'Event', v: `${d.eventId.slice(0, 13)}…` },
        ]),
  ];

  const onDown = (e: RPointerEvent) => {
    if (mobile || (e.target as HTMLElement).closest('button')) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    if (drag.current) {
      setOffset({
        x: drag.current.ox + e.clientX - drag.current.x,
        y: drag.current.oy + e.clientY - drag.current.y,
      });
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const k = mobile ? 0.6 : 1;
    setTilt({ x: -py * 16 * k, y: px * 20 * k });
  };
  const z = (n: number): CSSProperties => ({ transform: `translateZ(${n}px)` });

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 90,
        perspective: mobile ? 900 : 1100,
        ...(mobile
          ? { left: 0, right: 0, bottom: 0, perspectiveOrigin: '50% 100%' }
          : {
              top: 96,
              right: 24,
              width: 380,
              translate: `${offset.x}px ${offset.y}px`,
            }),
      }}
    >
      <div
        className={mobile ? 'wm-sheetin' : 'wm-cardin'}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          role="dialog"
          aria-label={`${labelOf(d)} sighting`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => !drag.current && setTilt({ x: 0, y: 0 })}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`,
            transition: 'transform .25s ease-out',
            color: 'var(--text)',
            display: 'flex',
            flexDirection: 'column',
            gap: mobile ? 12 : 16,
            padding: mobile ? '10px 16px 16px' : 16,
            borderRadius: mobile ? '30px 30px 0 0' : 32,
            background: 'var(--panel)',
            border: '8px solid #F2F1EC',
            ...(mobile
              ? { borderBottom: 0 }
              : { cursor: drag.current ? 'grabbing' : 'grab' }),
            boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
          }}
        >
          {mobile && (
            <span
              aria-hidden="true"
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 99,
                background: 'rgba(231,240,234,0.25)',
              }}
            />
          )}
          <div
            style={{
              position: 'relative',
              height: mobile ? 150 : 200,
              borderRadius: '20px 20px 20px 4px',
              overflow: 'hidden',
              background: '#1A3024',
              boxShadow: '0 18px 36px rgba(0,0,0,0.45)',
              ...z(32),
            }}
          >
            {photo && (
              <img
                src={photo}
                alt={
                  image.data ? `Capture from ${d.deviceId}` : (sp?.alt ?? '')
                }
                draggable={false}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: image.data
                    ? undefined
                    : 'grayscale(1) sepia(0.35) hue-rotate(60deg) saturate(1.6) contrast(1.15) brightness(0.85)',
                }}
              />
            )}
            <div
              className="wm-scan"
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 1,
                background: 'rgba(190,227,201,0.6)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--mono)',
                fontSize: 10,
              }}
            >
              <span
                className="wm-blink"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--coral)',
                }}
              />
              IR · {d.deviceId}
            </div>
            <div
              style={{
                position: 'absolute',
                left: 12,
                bottom: 10,
                fontFamily: 'var(--mono)',
                fontSize: 10,
              }}
            >
              {fmtDate(d.capturedAt)} {fmtTimeSec(d.capturedAt)}
            </div>
            <div
              style={{
                position: 'absolute',
                right: 12,
                bottom: 10,
                fontFamily: 'var(--mono)',
                fontSize: 9,
                color: 'var(--label)',
              }}
            >
              {image.data ? 'capture' : 'reference photo'}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              ...z(56),
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minWidth: 0,
              }}
            >
              <StatusChip status={d.classificationStatus} />
              <h2
                style={{
                  margin: 0,
                  fontSize: 30,
                  fontWeight: 500,
                  lineHeight: 1.05,
                }}
              >
                {labelOf(d)}
              </h2>
              <span
                style={{
                  fontStyle: 'italic',
                  fontWeight: 300,
                  color: 'var(--muted)',
                  fontSize: 14,
                }}
              >
                {subLabelOf(d, true)}
              </span>
            </div>
            {conf != null && (
              <div
                style={{
                  position: 'relative',
                  width: 70,
                  height: 70,
                  flex: 'none',
                  ...z(24),
                }}
              >
                <svg
                  width="70"
                  height="70"
                  viewBox="0 0 72 72"
                  role="img"
                  aria-label={`Model score ${Math.round(conf * 100)} percent`}
                >
                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke="rgba(231,240,234,0.10)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke="#BEE3C9"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${(conf * 175.9).toFixed(1)} 175.9`}
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 17,
                    fontWeight: 500,
                  }}
                >
                  {Math.round(conf * 100)}%
                </div>
              </div>
            )}
          </div>
          {!mobile && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--body)',
                ...z(36),
              }}
            >
              {sp?.note ??
                'Hidden from the public journal; kept for researchers.'}
            </p>
          )}
          <div style={z(24)}>
            <Fields fields={fields} gap="10px 14px" />
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4, ...z(28) }}>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous sighting"
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                border: '1px solid rgba(231,240,234,0.2)',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              ←
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 999,
                border: '1px solid rgba(231,240,234,0.2)',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={onNext}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 999,
                border: 0,
                background: 'var(--cream)',
                color: 'var(--bg)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Next sighting →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { useDetections, useMe } from '../../api/hooks';
import type { AnyDetection } from '../../api/types';
import { useBubbleProps } from '../../components/Bubble';
import { IconChevron } from '../../components/icons';
import { useIsMobile, useIsTablet } from '../../lib/hooks';
import { speciesFor } from '../../lib/species';
import { hourTod, TOD_WORDS } from '../../lib/sun';
import { sectionStore } from '../../lib/sections';
import { landing, useStore } from '../../lib/store';
import { ago, RANGE_WORDS } from '../../lib/time';
import { detectionBubble, hourBars } from '../bubbles';
import { FrameDraw } from './FrameDraw';
import type { OverviewData } from './Overview';

const PAD_DESKTOP = 22;

let introPlayed = false;
const INTRO_MS = 1800;
function shouldPlayIntro(): boolean {
  if (introPlayed) return false;
  introPlayed = true;
  if (location.hash) return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Hero({
  data,
  heroP: hp,
  onCycleRange,
  loading,
}: {
  data: OverviewData;
  heroP: number;
  onCycleRange: () => void;
  loading: boolean;
}) {
  const mobile = useIsMobile();
  const tablet = useIsTablet();
  const pad = mobile ? 8 : PAD_DESKTOP;
  const [intro, setIntro] = useState(shouldPlayIntro);
  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => setIntro(false), INTRO_MS + 200);
    return () => clearTimeout(t);
  }, [intro]);
  const { summary, species, parks, hourly, rangeLower, range } = data;

  const byHour =
    hourly?.buckets.map((b) => b.sightings) ??
    Array.from({ length: 24 }, () => 0);
  const byTod = { dawn: 0, day: 0, dusk: 0, night: 0 };
  byHour.forEach((c, h) => (byTod[hourTod(h)] += c));
  const peakTod = (Object.keys(byTod) as (keyof typeof byTod)[]).sort(
    (a, b) => byTod[b] - byTod[a],
  )[0];
  const parksActive = parks?.filter((p) => p.sightings > 0) ?? [];
  const spTop = species ?? [];
  const sl = (arr: { speciesLabel: string; sightings: number }[]) =>
    arr.map((s) => ({
      label: s.speciesLabel,
      value: s.sightings,
      photo: speciesFor(s.speciesLabel)?.photo,
    }));

  const animalsB = useBubbleProps(() => ({
    title: `${summary?.sightings ?? 0} sightings`,
    sub: `identified animals · ${rangeLower}`,
    photo: speciesFor(spTop[0]?.speciesLabel)?.photo,
    list: sl(spTop.slice(0, 4)),
    hint: 'SCROLL DOWN TO MEET THEM',
  }));
  const speciesB = useBubbleProps(() => ({
    title: `${spTop.length} species`,
    sub: 'mammals of the city parks',
    list: sl(spTop),
  }));
  const parksB = useBubbleProps(() => ({
    title: `${parksActive.length} green spaces`,
    sub: `${summary?.activeDeployments ?? 0} ESP32 camera traps`,
    list: [...parksActive]
      .sort((a, b) => b.sightings - a.sightings)
      .slice(0, 4)
      .map((p) => ({
        label: p.parkName,
        value: p.sightings,
        photo: speciesFor(p.species[0]?.speciesLabel)?.photo,
      })),
    note: 'Each camera wakes on motion, takes a photo, uploads it and goes back to sleep after milliseconds of radio time.',
  }));
  const peakB = useBubbleProps(() => ({
    title: 'Rush hour',
    sub: 'busiest part of the day',
    color: '#D9775F',
    bars: hourBars(byHour),
    rows: [
      { k: 'Dawn', v: String(byTod.dawn) },
      { k: 'Day', v: String(byTod.day) },
      { k: 'Dusk', v: String(byTod.dusk) },
      { k: 'Night', v: String(byTod.night) },
    ],
  }));

  const statPill: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '0 8px 1px',
    margin: '2px 0',
    borderRadius: 6,
    border: 0,
    cursor: 'pointer',
    fontSize: 'inherit',
    fontWeight: 500,
    lineHeight: 1.5,
    background: 'var(--frame)',
    color: 'var(--bg)',
    opacity: loading ? 0.6 : 1,
  };

  return (
    <section
      id="wm-top"
      aria-label="Welcome"
      style={{ padding: pad, boxSizing: 'border-box' }}
    >
      <div
        style={{
          position: 'relative',
          padding:
            ((mobile ? 6 : 10) + hp * (mobile ? 6 : 14)).toFixed(1) + 'px',
          borderRadius: ((mobile ? 26 : 36) + hp * 22).toFixed(1) + 'px',
          background: intro ? 'transparent' : 'var(--frame)',
          transformOrigin: '50% 100%',
          transform: `scale(${(1 - hp * 0.07).toFixed(3)})`,
          transition:
            'transform .18s linear, padding .18s linear, border-radius .18s linear',
        }}
      >
        {intro && (
          <FrameDraw
            thickness={mobile ? 6 : 10}
            radius={mobile ? 26 : 36}
            duration={INTRO_MS}
            onDone={() => setIntro(false)}
          />
        )}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: ((mobile ? 20 : 28) + hp * 18).toFixed(1) + 'px',
            height: mobile
              ? 760
              : `clamp(480px, calc(100svh - ${pad * 2 + 20}px), 1100px)`,
            background: '#0E1F16',
            filter: `brightness(${(1 - hp * 0.5).toFixed(3)})`,
            transition: 'border-radius .18s linear, filter .18s linear',
          }}
        >
          <img
            className="wm-kb"
            src="/assets/hero-forest.jpg"
            alt="Aerial photograph of a road curving through dense conifer forest"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, rgba(6,14,10,0.55) 0%, rgba(6,14,10,0.12) 50%, rgba(6,14,10,0.62) 100%), linear-gradient(0deg, rgba(6,14,10,0.94) 0%, rgba(6,14,10,0.55) 28%, rgba(6,14,10,0) 50%)',
            }}
          />
          {!mobile && <Notch intro={intro} />}
          {!mobile && <Pager />}

          <h1
            className="wm-rise"
            style={{
              position: 'absolute',
              zIndex: 2,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'none',
              fontWeight: 400,
              ...(mobile
                ? { left: 22, top: 150 }
                : { left: tablet ? '9%' : '13%', top: '23%' }),
            }}
          >
            <span
              style={{
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: '#D7EEDD',
                marginLeft: mobile ? 4 : 10,
                fontSize: mobile
                  ? 34
                  : tablet
                    ? 'clamp(26px, min(3.6vw, 6svh), 44px)'
                    : 'clamp(30px, min(4.4vw, 7svh), 66px)',
              }}
            >
              the city's
            </span>
            <span
              style={{
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 0.8,
                margin: mobile ? '6px 0' : '10px 0 6px',
                background: 'linear-gradient(180deg,#DDF1E2 0%,#A9D7B8 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontSize: mobile
                  ? 132
                  : tablet
                    ? 'min(14vw, 30svh)'
                    : 'clamp(110px, min(21vw, 33svh), 320px)',
              }}
            >
              WILD
            </span>
            <span
              style={{
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: '#D7EEDD',
                alignSelf: 'flex-end',
                fontSize: mobile
                  ? 30
                  : tablet
                    ? 'clamp(26px, min(3.6vw, 6svh), 44px)'
                    : 'clamp(30px, min(4.4vw, 7svh), 66px)',
              }}
            >
              side of Łódź
            </span>
          </h1>
          <img
            className="wm-kb"
            src="/assets/hero-crowns.webp"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              zIndex: 3,
              filter: 'brightness(0.86)',
              WebkitMaskImage:
                'radial-gradient(ellipse 30% 26% at 32% 42%, #000 55%, transparent 100%)',
              maskImage:
                'radial-gradient(ellipse 30% 26% at 32% 42%, #000 55%, transparent 100%)',
            }}
          />

          <Spotlight now={data.now} />

          <div
            style={{
              position: 'absolute',
              zIndex: 4,
              left: mobile ? 22 : '7%',
              right: mobile ? 22 : '7%',
              bottom: mobile ? 22 : 34,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: mobile ? 20 : '28px 56px',
              paddingTop: 22,
              borderTop: '1px solid rgba(231,240,234,0.4)',
            }}
          >
            {!mobile && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  color: 'var(--muted)',
                  flex: 'none',
                  width: 120,
                }}
              >
                <span>{summary?.activeDeployments ?? '–'} CAMERA TRAPS</span>
                <span>{summary?.parks ?? '–'} GREEN SPACES</span>
                <span>AY 2026 / 27</span>
              </div>
            )}
            <p
              style={{
                margin: 0,
                flex: '1 1 360px',
                fontWeight: 300,
                lineHeight: 1.75,
                color: 'var(--text)',
                fontSize: mobile ? 15 : 17,
                maxWidth: 620,
              }}
            >
              In the last{' '}
              <button
                type="button"
                onClick={onCycleRange}
                aria-label={`Period: ${RANGE_WORDS[range]}. Change period`}
                className="wm-stat"
                style={statPill}
              >
                {RANGE_WORDS[range]} ▾
              </button>{' '}
              our cameras met{' '}
              <button
                type="button"
                className="wm-stat"
                style={statPill}
                {...animalsB}
              >
                {summary?.sightings ?? '…'} animals
              </button>{' '}
              of{' '}
              <button
                type="button"
                className="wm-stat"
                style={statPill}
                {...speciesB}
              >
                {spTop.length} species
              </button>{' '}
              across{' '}
              <button
                type="button"
                className="wm-stat"
                style={statPill}
                {...parksB}
              >
                {parksActive.length} parks
              </button>
              , most of them{' '}
              <button
                type="button"
                className="wm-stat"
                style={statPill}
                {...peakB}
              >
                {TOD_WORDS[peakTod]}
              </button>
              .
            </p>
            <a
              href="#wm-guide"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                color: 'var(--text)',
                textDecoration: 'none',
                flex: 'none',
                padding: '6px 22px 6px 6px',
                borderRadius: 999,
                background: 'rgba(8,18,12,0.66)',
                border: '1px solid rgba(190,227,201,0.2)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <svg
                width="62"
                height="62"
                viewBox="0 0 64 64"
                aria-hidden="true"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="#E7F0EA"
                  strokeWidth="1.2"
                />
                <path
                  d="M14 42l10-14 6 8 5-6 9 12z"
                  fill="none"
                  stroke="#E7F0EA"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <circle cx="42" cy="22" r="3" fill="#E7F0EA" />
              </svg>
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  fontSize: 14,
                }}
              >
                <span style={{ fontWeight: 500, color: 'var(--cream)' }}>
                  Meet the residents
                </span>
                <span style={{ color: 'var(--mint)' }}>scroll ↓</span>
              </span>
            </a>
          </div>
          <span
            style={{
              position: 'absolute',
              right: 18,
              top: '50%',
              transform: 'rotate(90deg) translateX(50%)',
              transformOrigin: '100% 50%',
              zIndex: 4,
              fontSize: 10,
              color: 'rgba(231,240,234,0.6)',
              whiteSpace: 'nowrap',
            }}
          >
            Photo · Marcinjozwiak · CC BY-SA 4.0
          </span>
          {intro && (
            <div
              aria-hidden="true"
              className="wm-intro-veil"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 5,
                background: '#0E1F16',
                pointerEvents: 'none',
                animationDuration: `${INTRO_MS * 0.8}ms`,
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Notch({ intro }: { intro: boolean }) {
  const land = useStore(landing, (s) => s);
  const islW = land.islandW;
  const nH = 52 + 4;
  const nW = islW + 36;
  const ease = 'cubic-bezier(.32,.72,0,1)';
  return (
    <div
      className={`wm-notch${intro ? ' wm-notch-in' : ''}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        width: nW,
        height: nH,
        background: 'var(--frame)',
        borderRadius: `0 0 ${nH / 2}px ${nH / 2}px`,
        zIndex: 7,
        transformOrigin: '50% 0',
        transform: `translateX(-50%) scaleY(${land.attached ? 1 : 0})`,
        opacity: land.attached ? 1 : 0,
        transition: `transform .55s ${ease}, opacity .4s ${ease}, width .6s cubic-bezier(.34,1.32,.5,1)`,
      }}
    />
  );
}

function Pager() {
  const section = useStore(sectionStore, (s) => s.current);
  const items: [string, string][] = [
    ['#wm-top', 'Welcome'],
    ['#wm-guide', 'Field guide'],
    ['#wm-map', 'Map'],
    ['#wm-rhythm', 'Daily rhythm'],
  ];
  return (
    <nav
      aria-label="Sections"
      style={{
        position: 'absolute',
        left: 34,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 6,
      }}
    >
      {items.map(([href, label], i) => (
        <a
          key={href}
          href={href}
          aria-label={label}
          aria-current={i === section ? 'location' : undefined}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            width: 28,
            height: i ? 56 : 28,
            textDecoration: 'none',
            ...(i
              ? {
                  background:
                    'linear-gradient(rgba(231,240,234,0.5),rgba(231,240,234,0.5)) 50% 0 / 1px 38px no-repeat',
                }
              : {}),
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              boxSizing: 'border-box',
              border: '2px solid #E7F0EA',
              marginBottom: 8,
              transition:
                'background .4s, transform .5s cubic-bezier(.34,1.32,.5,1)',
              ...(i === section
                ? { background: '#E7F0EA', transform: 'scale(1.3)' }
                : { background: 'transparent' }),
            }}
          />
        </a>
      ))}
    </nav>
  );
}

function Spotlight({ now }: { now: number }) {
  const mobile = useIsMobile();
  const tablet = useIsTablet();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data } = useDetections(
    { pageSize: 8, sort: 'newest', classificationStatus: ['IDENTIFIED'] },
    me?.id ?? null,
  );
  const recent = (data?.items ?? []) as AnyDetection[];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => i + 1), 9000);
    return () => clearInterval(t);
  }, []);
  const n = recent.length;
  const i = n ? ((idx % n) + n) % n : 0;
  const rec = recent[i];
  const sp = speciesFor(rec?.speciesLabel);
  const bubble = useBubbleProps(
    rec && !mobile ? () => detectionBubble(rec) : null,
  );
  const arrow: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '1.5px solid rgba(231,240,234,0.7)',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  };

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        boxSizing: 'border-box',
        borderRadius: '28px 28px 28px 8px',
        background: 'rgba(8,18,12,0.66)',
        border: '1px solid rgba(190,227,201,0.2)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        ...(mobile
          ? { left: 16, right: 16, top: 420 }
          : tablet
            ? { right: '4%', top: '30%', width: 270 }
            : { right: '6%', top: '28%', width: 330 }),
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.16em',
            color: 'var(--mint)',
          }}
        >
          LATEST VISITORS · {String(n ? i + 1 : 0).padStart(2, '0')} /{' '}
          {String(n).padStart(2, '0')}
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="wm-arrowbtn"
            aria-label="Previous visitor"
            onClick={() => setIdx((v) => v - 1)}
            style={arrow}
          >
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            className="wm-arrowbtn"
            aria-label="Next visitor"
            onClick={() => setIdx((v) => v + 1)}
            style={arrow}
          >
            <IconChevron />
          </button>
        </span>
      </div>
      <button
        type="button"
        disabled={!rec}
        aria-label={
          rec
            ? `${rec.speciesLabel} near ${rec.parkName}, ${ago(now, rec.capturedAt)}. Open in the journal`
            : 'Loading the latest visitor'
        }
        onClick={() => rec && navigate(`/journal?id=${rec.id}`)}
        {...bubble}
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          padding: 0,
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text)',
          minHeight: 86,
        }}
      >
        {sp ? (
          <img
            src={sp.photo}
            alt={sp.alt}
            style={{
              width: 86,
              height: 86,
              borderRadius: '22px 22px 22px 4px',
              objectFit: 'cover',
              flex: 'none',
              boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
            }}
          />
        ) : (
          <span
            className="wm-skeleton"
            style={{
              width: 86,
              height: 86,
              borderRadius: '22px 22px 22px 4px',
              flex: 'none',
            }}
          />
        )}
        {rec && (
          <span
            aria-live="polite"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.1 }}>
              {rec.speciesLabel}
            </span>
            <span style={{ fontSize: 13, color: 'var(--label)' }}>
              near {rec.parkName}
            </span>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--mint)',
              }}
            >
              {ago(now, rec.capturedAt)} · {rec.timeOfDay}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

import { useState } from 'react';
import { useBubble } from '../../components/Bubble';
import { eyebrow } from '../../components/ui';
import { useIsMobile } from '../../lib/hooks';
import { hourTod } from '../../lib/sun';
import { pad2 } from '../../lib/time';
import { hourBubble } from '../bubbles';
import { h2Style, type OverviewData } from './Overview';

export function Rhythm({ data }: { data: OverviewData }) {
  const mobile = useIsMobile();
  const { show, hide } = useBubble();
  const [hovered, setHovered] = useState<number | null>(null);
  const byHour =
    data.hourly?.buckets.map((b) => b.sightings) ??
    Array.from({ length: 24 }, () => 0);
  const max = Math.max(1, ...byHour);
  const peakHour = byHour.indexOf(Math.max(...byHour));
  const shown = hovered ?? peakHour;

  const byTod = { dawn: 0, day: 0, dusk: 0, night: 0 };
  byHour.forEach((c, h) => (byTod[hourTod(h)] += c));
  const peakTod = (Object.keys(byTod) as (keyof typeof byTod)[]).sort(
    (a, b) => byTod[b] - byTod[a],
  )[0];
  const title =
    peakTod === 'night'
      ? 'The city is theirs after dark.'
      : peakTod === 'day'
        ? 'Daylight is busier than you think.'
        : `${peakTod === 'dusk' ? 'Dusk' : 'Dawn'} is rush hour in the parks.`;

  const topAt = (h: number) =>
    (data.species ?? [])
      .map((s) => ({ label: s.speciesLabel, n: s.hourly[h] }))
      .filter((s) => s.n > 0)
      .sort((a, b) => b.n - a.n)[0];

  const FS = mobile ? 300 : 400;
  const R = FS * 0.4;
  const dMin = mobile ? 8 : 10;
  const dMax = mobile ? 34 : 46;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap-reverse',
        alignItems: 'center',
        gap: '40px 80px',
      }}
    >
      <div
        style={{
          flex: '1 1 340px',
          minWidth: 0,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            padding: mobile ? '34px 22px' : '52px 48px',
            borderRadius: mobile ? 36 : 48,
            background: 'linear-gradient(160deg, #142B20 0%, #0E1E16 100%)',
            border: '1px solid rgba(190,227,201,0.12)',
            boxShadow:
              '0 50px 100px -50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(242,241,236,0.05)',
          }}
        >
          <div
            role="group"
            aria-label="Sightings by hour of day"
            style={{ position: 'relative', width: FS, height: FS }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: FS / 2 - R - 1,
                top: FS / 2 - R - 1,
                width: R * 2 + 2,
                height: R * 2 + 2,
                borderRadius: '50%',
                background:
                  'conic-gradient(from 270deg, rgba(242,241,236,0.45) 0deg 180deg, rgba(190,227,201,0.14) 180deg 360deg)',
                WebkitMaskImage:
                  'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
                maskImage:
                  'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: FS * 0.06,
                right: FS * 0.06,
                top: '50%',
                height: 1,
                background:
                  'linear-gradient(90deg, rgba(190,227,201,0), rgba(190,227,201,0.18) 25%, rgba(190,227,201,0.18) 75%, rgba(190,227,201,0))',
                pointerEvents: 'none',
              }}
            />
            {byHour.map((c, h) => {
              const d = dMin + Math.sqrt(c / max) * (dMax - dMin);
              const th = ((h * 15 + 180) * Math.PI) / 180;
              const cx = FS / 2 + Math.sin(th) * R;
              const cy = FS / 2 - Math.cos(th) * R;
              const active = shown === h;
              const enter = (e: { currentTarget: Element }) => {
                setHovered(h);
                if (!mobile)
                  show(
                    e.currentTarget,
                    hourBubble(h, data.hourly, data.species),
                  );
              };
              const leave = () => {
                setHovered(null);
                hide();
              };
              return (
                <button
                  key={h}
                  type="button"
                  className="wm-petal"
                  aria-label={`${pad2(h)}:00, ${c} sightings`}
                  onPointerEnter={enter}
                  onPointerLeave={leave}
                  onFocus={enter}
                  onBlur={leave}
                  style={{
                    position: 'absolute',
                    left: cx - d / 2,
                    top: cy - d / 2,
                    width: d,
                    height: d,
                    padding: 0,
                    border: 0,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: active ? 'var(--cream)' : 'var(--mint)',
                    opacity: active ? 1 : 0.28 + (c / max) * 0.6,
                    boxShadow: active
                      ? '0 0 0 6px rgba(242,241,236,0.12), 0 0 28px rgba(242,241,236,0.35)'
                      : 'none',
                    zIndex: active ? 3 : 2,
                    transition:
                      'background .35s, opacity .35s, box-shadow .35s, transform .45s cubic-bezier(.34,1.56,.64,1), width .6s, height .6s',
                  }}
                />
              );
            })}
            <div
              aria-live="polite"
              style={{
                position: 'absolute',
                inset: '27%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  color: 'var(--muted)',
                  fontWeight: 500,
                }}
              >
                {hovered != null
                  ? hourTod(hovered).toUpperCase()
                  : 'BUSIEST HOUR'}
              </span>
              <span
                style={{
                  fontWeight: 300,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: 'var(--cream)',
                  fontSize: mobile ? 42 : 58,
                }}
              >
                {pad2(shown)}:00
              </span>
              <span style={{ fontSize: 13, color: 'var(--label)' }}>
                {byHour[shown]} sightings · local
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {topAt(shown)
                  ? `mostly ${topAt(shown)!.label.toLowerCase()}`
                  : 'quiet hour'}
              </span>
            </div>
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F2F1EC"
              strokeWidth="1.6"
              strokeLinecap="round"
              style={{
                position: 'absolute',
                left: '50%',
                top: -14,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
            </svg>
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#BEE3C9"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: '50%',
                top: 'calc(100% + 14px)',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
            </svg>
            {[
              ['18', 90],
              ['06', 270],
            ].map(([t, deg]) => {
              const a = ((Number(deg) - 90) * Math.PI) / 180;
              const rad = FS / 2 + 12;
              return (
                <span
                  key={t}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: Math.round(FS / 2 + Math.cos(a) * rad),
                    top: Math.round(FS / 2 + Math.sin(a) * rad),
                    transform: 'translate(-50%,-50%)',
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    color: 'var(--label)',
                  }}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div
        style={{
          flex: '1 1 360px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 520,
          paddingBottom: 40,
        }}
      >
        <span style={eyebrow}>03 — THE DAILY RHYTHM</span>
        <h2 style={h2Style(mobile)}>{title}</h2>
        <p
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.75,
            color: 'var(--body)',
          }}
        >
          Each dot is one hour, following the sun across the sky: daylight on
          the upper arc, night below. Roe deer and hares slip out of the forest
          edge at first light and again as the sun goes down; foxes, martens and
          badgers take the night shift, while squirrels keep office hours.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            fontSize: 12,
            color: 'var(--muted)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--mint)',
                opacity: 0.5,
              }}
            />
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--mint)',
              }}
            />
            bigger dot, more sightings
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'var(--cream)',
                boxShadow: '0 0 0 3px rgba(242,241,236,0.15)',
              }}
            />
            hover an hour to read it
          </span>
        </div>
      </div>
    </div>
  );
}

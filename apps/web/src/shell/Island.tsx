import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { useMe, useSensorHealth } from '../api/hooks';
import {
  IconCamera,
  IconJournal,
  IconOverview,
  IconSystem,
} from '../components/icons';
import { useIsMobile } from '../lib/hooks';
import { sectionStore } from '../lib/sections';
import { createStore, landing, useStore } from '../lib/store';
import { PAGE_ORDER, type PageKey } from './pages';

export const liveBadge = createStore({ newCount: 0 });

const TAB_WIDTH_DESKTOP: Record<PageKey, number> = {
  overview: 120,
  journal: 108,
  sensors: 112,
  system: 104,
};
const TAB_META: Record<
  PageKey,
  { label: string; aria: string; Icon: typeof IconOverview }
> = {
  overview: { label: 'Overview', aria: 'Overview', Icon: IconOverview },
  journal: { label: 'Journal', aria: 'Field journal', Icon: IconJournal },
  sensors: { label: 'Sensors', aria: 'Sensors', Icon: IconCamera },
  system: { label: 'System', aria: 'System', Icon: IconSystem },
};

const SPRING = 'cubic-bezier(.34,1.32,.5,1)';
const IOS = 'cubic-bezier(.32,.72,0,1)';

export function Island({
  page,
  isLive,
  leaving,
  exitLive,
  compact = false,
}: {
  compact?: boolean;
  page: PageKey;
  isLive: boolean;
  leaving: boolean;
  exitLive: () => void;
}) {
  const mobile = useIsMobile();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const authed = !!me;
  const { data: health } = useSensorHealth(authed);
  const sensorAlert = !!health?.some(
    (s) => s.status === 'offline' || s.status === 'attention',
  );
  const land = useStore(landing, (s) => s);
  const secs = useStore(sectionStore, (s) => s);
  const newCount = useStore(liveBadge, (s) => s.newCount);

  const tabH = mobile ? 44 : 42;
  const order = authed ? PAGE_ORDER : PAGE_ORDER.slice(0, 2);
  const tw = (k: PageKey) =>
    mobile ? 44 : compact ? 52 : TAB_WIDTH_DESKTOP[k];
  const liveW = authed
    ? (mobile ? 88 : 96) + (isLive && newCount > 0 ? 38 : 0)
    : 0;
  const baseW =
    10 +
    order.reduce((s, k) => s + tw(k), 0) +
    2 * (order.length - 1) +
    (authed ? 4 + liveW : 0);
  const baseH = tabH + 10;
  const activeIdx = isLive ? -1 : order.indexOf(page);
  const pillLeft =
    5 +
    order.slice(0, Math.max(0, activeIdx)).reduce((s, k) => s + tw(k) + 2, 0);

  const onLanding = page === 'overview' && !isLive && !leaving && land.active;
  const peek = secs.peek && !isLive && !leaving && secs.sections.length > 0;
  const islW = baseW;
  const islH = baseH;
  useEffect(() => landing.set({ islandW: islW }), [islW]);
  const showDots = islW >= 300;
  const showEyebrow = islW >= 230;
  const lifted = !onLanding || mobile || !land.attached;
  const sec = secs.sections[secs.current] ?? secs.sections[0];

  const go = (k: PageKey) => navigate(k === 'overview' ? '/' : `/${k}`);
  const toggleLive = () => {
    if (isLive) exitLive();
    else void navigate('/live');
  };

  const islandStyle: CSSProperties = {
    position: 'fixed',
    ...(mobile ? { bottom: 16 } : { top: 26 }),
    left: '50%',
    transformOrigin: '50% 0',
    transform: 'translateX(-50%)',
    zIndex: 80,
    width: islW,
    height: islH,
    borderRadius: islH / 2,
    overflow: 'hidden',
    background: 'var(--frame)',
    boxShadow: lifted
      ? '0 18px 44px rgba(0,0,0,0.45)'
      : '0 0 0 0 rgba(0,0,0,0)',
    transition: `width .6s ${SPRING}, height .6s ${SPRING}, border-radius .6s ${SPRING}, box-shadow .55s cubic-bezier(.32,.72,0,1)`,
  };

  return (
    <nav aria-label="Primary" style={islandStyle}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: baseW,
          height: baseH,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '0 5px',
          boxSizing: 'border-box',
          whiteSpace: 'nowrap',
          transition: `opacity .28s, transform .5s ${IOS}, filter .3s`,
          ...(peek
            ? {
                opacity: 0,
                transform: 'translate(-50%,-50%) scale(.82)',
                filter: 'blur(6px)',
                pointerEvents: 'none',
              }
            : {
                opacity: 1,
                transform: 'translate(-50%,-50%)',
                filter: 'none',
              }),
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            zIndex: 0,
            top: 5,
            left: pillLeft,
            width: tw(order[Math.max(0, activeIdx)]),
            height: tabH,
            borderRadius: 999,
            background: 'var(--bg)',
            transition: `left .55s ${SPRING}, width .55s ${SPRING}, opacity .3s, transform .45s ${IOS}`,
            ...(activeIdx < 0
              ? { opacity: 0, transform: 'scale(.6)' }
              : { opacity: 1, transform: 'none' }),
          }}
        />
        {order.map((k) => {
          const on = activeIdx >= 0 && order[activeIdx] === k;
          const { Icon, label, aria } = TAB_META[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => go(k)}
              aria-label={aria}
              aria-current={on ? 'page' : undefined}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                flex: 'none',
                width: tw(k),
                height: tabH,
                padding: 0,
                borderRadius: 999,
                border: 0,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                background: 'transparent',
                transition: `color .35s ${IOS}`,
                color: on ? 'var(--cream)' : 'var(--bg)',
              }}
            >
              <Icon />
              {!mobile && !compact && <span>{label}</span>}
              {k === 'sensors' && sensorAlert && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--terracotta)',
                  }}
                />
              )}
            </button>
          );
        })}
        {authed && (
          <button
            type="button"
            className="wm-livebtn"
            onClick={toggleLive}
            aria-pressed={isLive}
            aria-label={isLive ? 'Leave the live map' : 'Open the live map'}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              flex: 'none',
              width: liveW,
              height: tabH,
              padding: 0,
              marginLeft: 4,
              transition: `width .5s ${SPRING}`,
              borderRadius: 999,
              border: 0,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.12em',
              background: 'var(--terracotta)',
              color: '#FFFFFF',
            }}
          >
            <span className="wm-livedot" />
            LIVE
            {isLive && newCount > 0 && (
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: 'var(--cream)',
                  color: 'var(--terracotta)',
                  letterSpacing: 0,
                }}
              >
                +{newCount}
              </span>
            )}
          </button>
        )}
      </div>

      <div
        aria-live="polite"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: `0 ${showDots ? 18 : 14}px 0 5px`,
          boxSizing: 'border-box',
          transition: `opacity .35s ${peek ? '.12s' : '0s'}, transform .55s ${IOS}`,
          ...(peek
            ? { opacity: 1, transform: 'none' }
            : { opacity: 0, transform: 'scale(1.12)', pointerEvents: 'none' }),
        }}
      >
        {peek && sec && (
          <>
            <img
              src={sec.photo}
              alt=""
              style={{
                width: baseH - 10,
                height: baseH - 10,
                borderRadius: '50%',
                objectFit: 'cover',
                flex: 'none',
              }}
            />
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minWidth: 0,
                flex: 1,
              }}
            >
              {showEyebrow && (
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    letterSpacing: '0.16em',
                    lineHeight: 1.3,
                    color: '#3F5A49',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {String(secs.current).padStart(2, '0')} · NOW VIEWING
                </span>
              )}
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: 'var(--bg)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {sec.title}
              </span>
            </span>
            {showDots && (
              <span
                aria-hidden="true"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flex: 'none',
                }}
              >
                {secs.sections.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'block',
                      height: 6,
                      borderRadius: 3,
                      transition: `width .45s ${SPRING}, background .3s`,
                      width: i === secs.current ? 18 : 6,
                      background:
                        i === secs.current
                          ? 'var(--bg)'
                          : 'rgba(11,23,17,0.22)',
                    }}
                  />
                ))}
              </span>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

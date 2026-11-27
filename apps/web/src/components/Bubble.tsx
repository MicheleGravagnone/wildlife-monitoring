import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useIsMobile } from '../lib/hooks';
import { placeBubble, type Placement } from './bubblePlacement';

export interface BubbleContent {
  title: string;
  sub?: string;
  color?: string;
  photo?: string | null;
  big?: number | string;
  bigLabel?: string;
  bars?: { value: number; color: string }[];
  list?: { label: string; value: string | number; photo?: string }[];
  rows?: { k: string; v: string }[];
  note?: string;
  hint?: string;
}

interface BubbleApi {
  show: (target: Element, content: BubbleContent) => void;
  hide: () => void;
}

const Ctx = createContext<BubbleApi>({ show: () => {}, hide: () => {} });

export function useBubble(): BubbleApi {
  return useContext(Ctx);
}

export function useBubbleProps(content: (() => BubbleContent | null) | null) {
  const { show, hide } = useBubble();
  if (!content) return {};
  const open = (e: { currentTarget: Element }) => {
    const c = content();
    if (c) show(e.currentTarget, c);
  };
  return {
    onPointerEnter: open,
    onPointerLeave: hide,
    onFocus: open,
    onBlur: hide,
  };
}

export function BubbleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    content: BubbleContent;
    at: Placement;
  } | null>(null);
  const mobile = useIsMobile();
  const width = mobile ? 260 : 290;

  const show = useCallback(
    (target: Element, content: BubbleContent) => {
      const r = target.getBoundingClientRect();
      const at = placeBubble(r, window.innerWidth, width / 2);
      setState({ content, at });
    },
    [width],
  );
  const hide = useCallback(() => setState(null), []);

  useEffect(() => {
    if (!state) return;
    window.addEventListener('scroll', hide, { passive: true });
    return () => window.removeEventListener('scroll', hide);
  }, [state, hide]);

  const api = useMemo(() => ({ show, hide }), [show, hide]);
  return (
    <Ctx.Provider value={api}>
      {children}
      {state && (
        <BubbleView content={state.content} at={state.at} width={width} />
      )}
    </Ctx.Provider>
  );
}

const mono = { fontFamily: 'var(--mono)' } as const;

function BubbleView({
  content: c,
  at,
  width,
}: {
  content: BubbleContent;
  at: Placement;
  width: number;
}) {
  const hairline = '1px solid rgba(190,227,201,0.22)';
  const max = Math.max(1, ...(c.bars?.map((b) => b.value) ?? [1]));
  return (
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        zIndex: 150,
        pointerEvents: 'none',
        left: at.x,
        top: at.y,
        width,
        transform: `translate(-50%, ${at.below ? '0' : '-100%'})`,
        transition:
          'left .28s cubic-bezier(.2,.9,.25,1), top .28s cubic-bezier(.2,.9,.25,1)',
      }}
    >
      <div
        className="wm-bubin"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '10px 12px 14px',
          borderRadius: 24,
          background: 'rgba(11,23,17,0.95)',
          border: hairline,
          boxShadow: '0 24px 60px -10px rgba(0,0,0,0.75)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          color: 'var(--text)',
          transformOrigin: `50% ${at.below ? '0' : '100%'}`,
        }}
      >
        {c.photo && (
          <img
            src={c.photo}
            alt=""
            style={{
              width: '100%',
              height: 120,
              objectFit: 'cover',
              borderRadius: '16px 16px 16px 4px',
              display: 'block',
            }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              flex: 'none',
              background: c.color ?? 'var(--mint)',
            }}
          />
          <span
            style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                lineHeight: 1.15,
                color: 'var(--cream)',
              }}
            >
              {c.title}
            </span>
            {c.sub && (
              <span
                style={{
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                {c.sub}
              </span>
            )}
          </span>
        </div>
        {c.big !== undefined && (
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 300,
                lineHeight: 1,
                color: 'var(--mint)',
              }}
            >
              {c.big}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {c.bigLabel}
            </span>
          </span>
        )}
        {c.bars && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                height: 32,
              }}
            >
              {c.bars.map((b, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderRadius: '2px 2px 0 0',
                    height: `${Math.max(6, (b.value / max) * 100).toFixed(0)}%`,
                    background: b.color,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                ...mono,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 9,
                color: 'var(--muted)',
              }}
            >
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>24</span>
            </div>
          </div>
        )}
        {c.list && c.list.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.list.map((l) => (
              <div
                key={l.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                }}
              >
                {l.photo ? (
                  <img
                    src={l.photo}
                    alt=""
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flex: 'none',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#1A3024',
                      flex: 'none',
                    }}
                  />
                )}
                <span style={{ flex: 1, color: 'var(--text)' }}>{l.label}</span>
                <span style={{ ...mono, color: 'var(--body)' }}>{l.value}</span>
              </div>
            ))}
          </div>
        )}
        {c.rows && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '8px 12px',
            }}
          >
            {c.rows.map((r) => (
              <div
                key={r.k}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  {r.k}
                </span>
                <span
                  style={{
                    ...mono,
                    fontSize: 12,
                    color: 'var(--text)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {r.v}
                </span>
              </div>
            ))}
          </div>
        )}
        {c.note && (
          <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--body)' }}>
            {c.note}
          </span>
        )}
        {c.hint && (
          <span
            style={{
              ...mono,
              fontSize: 10,
              letterSpacing: '0.08em',
              color: 'var(--mint)',
            }}
          >
            {c.hint}
          </span>
        )}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `calc(50% + ${at.tail.toFixed(0)}px - 7px)`,
            width: 13,
            height: 13,
            transform: 'rotate(45deg)',
            background: 'rgb(11,23,17)',
            ...(at.below
              ? { top: -7, borderLeft: hairline, borderTop: hairline }
              : { bottom: -7, borderRight: hairline, borderBottom: hairline }),
          }}
        />
      </div>
    </div>
  );
}

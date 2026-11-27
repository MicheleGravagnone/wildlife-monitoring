import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useDaily } from '../../api/hooks';
import { Dropdown } from '../../components/Dropdown';
import { IconChevron, IconFilters } from '../../components/icons';
import { Chip } from '../../components/ui';
import { useIsMobile } from '../../lib/hooks';
import { PARKS } from '../../lib/parks';
import { SPECIES } from '../../lib/species';
import { fmtDate, fmtDay } from '../../lib/time';
import { activeCount, DEFAULT_FILTERS, type JournalFilters } from './filters';

const W = 280;
const SPRING = 'cubic-bezier(.34,1.3,.5,1)';

export function FiltersIsland({
  filters: f,
  set,
  staff,
  open,
  onToggle,
  hidden,
}: {
  filters: JournalFilters;
  set: (patch: Partial<JournalFilters>) => void;
  staff: boolean;
  open: boolean;
  onToggle: () => void;
  hidden: boolean;
}) {
  const mobile = useIsMobile();
  const body = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(760);
  const [vh, setVh] = useState(() => window.innerHeight);
  const daily = useDaily({
    days: 30,
    species: f.species.length ? f.species : undefined,
    parkName: f.park !== 'all' ? f.park : undefined,
  });
  const count = activeCount(f, staff);

  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const measure = () => setHeight(Math.max(420, Math.ceil(el.scrollHeight)));
    measure();
    const ro = new ResizeObserver(measure);
    for (const c of Array.from(el.children)) ro.observe(c);
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [staff, open]);

  const fits = height + 124 <= vh;
  const island: CSSProperties = {
    ...(mobile
      ? { position: 'fixed', zIndex: 60 }
      : {
          position: 'sticky',
          top: fits ? 100 : Math.min(100, vh - height - 24),
          pointerEvents: 'auto',
        }),
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: 'rgba(16,34,26,0.86)',
    border: '1px solid rgba(190,227,201,0.16)',
    boxShadow: '0 30px 70px -20px rgba(0,0,0,0.7)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    ...(mobile
      ? open
        ? {
            left: 10,
            bottom: 82,
            width: 'calc(100vw - 20px)',
            height: 'min(72vh, 640px)',
            borderRadius: 28,
          }
        : { left: 16, bottom: 84, width: 56, height: 56, borderRadius: 28 }
      : open
        ? { width: W, height, borderRadius: 30 }
        : { width: 64, height: 64, borderRadius: 32 }),
    translate: hidden ? '-130% 0' : '0 0',
    transition: `width .62s ${SPRING}, height .62s ${SPRING}, border-radius .62s ${SPRING}, translate .55s var(--ios)`,
  };

  const sec = (delay: number, children: ReactNode, extra?: CSSProperties) => (
    <div
      className={open ? 'wm-fsec-in' : undefined}
      style={{
        animationDelay: `${delay}s`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        ...extra,
      }}
    >
      {children}
    </div>
  );
  const label = (t: string) => (
    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--label)' }}>
      {t}
    </span>
  );
  const group = (name: string, children: ReactNode) => (
    <div
      role="group"
      aria-label={name}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}
    >
      {children}
    </div>
  );

  const buckets = daily.data?.buckets ?? [];
  const maxDay = Math.max(1, ...buckets.map((b) => b.sightings));
  const today = fmtDate(Date.now());
  const periodStart = { '24h': 1, '7d': 7, '30d': 30 }[f.period];

  return (
    <aside className="wm-fisland-in" aria-label="Filters" style={island}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={count ? `Show filters, ${count} active` : 'Show filters'}
        tabIndex={open ? -1 : 0}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: mobile ? 56 : 64,
          height: mobile ? 56 : 64,
          border: 0,
          padding: 0,
          background: 'transparent',
          color: 'var(--text)',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          transition: `opacity .25s, transform .5s ${SPRING}`,
          ...(open
            ? {
                opacity: 0,
                transform: 'scale(.5) rotate(-90deg)',
                pointerEvents: 'none',
              }
            : { opacity: 1, transform: 'none' }),
        }}
      >
        <IconFilters />
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 9,
              right: 9,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              boxSizing: 'border-box',
              borderRadius: 9,
              background: 'var(--mint)',
              color: 'var(--bg)',
              fontSize: 10,
              fontWeight: 700,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {count}
          </span>
        )}
      </button>

      <div
        ref={body}
        inert={!open}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: mobile ? 'calc(100vw - 20px)' : W,
          height: mobile ? '100%' : 'auto',
          boxSizing: 'border-box',
          padding: '20px 18px 22px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          transition: `opacity .3s ${open ? '.16s' : '0s'}, filter .35s, transform .55s var(--ios)`,
          ...(open
            ? { opacity: 1, filter: 'none', transform: 'none' }
            : {
                opacity: 0,
                filter: 'blur(6px)',
                transform: 'translateX(-14px) scale(.96)',
                pointerEvents: 'none',
              }),
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{ fontSize: 22, fontWeight: 500, color: 'var(--cream)' }}
          >
            Filters
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => set({ ...DEFAULT_FILTERS, sort: f.sort })}
              style={{
                height: 36,
                padding: '0 12px',
                borderRadius: 999,
                border: 0,
                background: 'transparent',
                color: 'var(--mint)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Hide filters"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid rgba(190,227,201,0.22)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IconChevron dir={mobile ? 'down' : 'left'} />
            </button>
          </span>
        </div>

        {sec(
          0.08,
          <Dropdown
            label="Park"
            value={f.park}
            options={[
              { value: 'all', label: 'All parks' },
              ...PARKS.map((p) => ({ value: p.name, label: p.name })),
            ]}
            onChange={(park) => set({ park })}
          />,
        )}
        {sec(
          0.13,
          <Dropdown
            label="Sort by"
            value={f.sort}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'species', label: 'Species A–Z' },
              ...(staff
                ? [{ value: 'confidence' as const, label: 'Highest score' }]
                : []),
            ]}
            onChange={(sort) => set({ sort })}
          />,
        )}
        {sec(
          0.18,
          <>
            {label('Species')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SPECIES.map((s) => {
                const on = f.species.includes(s.label);
                return (
                  <Chip
                    key={s.key}
                    on={on}
                    style={{ paddingLeft: 14 }}
                    onClick={() =>
                      set({
                        species: on
                          ? f.species.filter((x) => x !== s.label)
                          : [...f.species, s.label],
                      })
                    }
                  >
                    <img
                      src={s.photo}
                      alt=""
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginLeft: -10,
                      }}
                    />
                    {s.label}
                  </Chip>
                );
              })}
            </div>
          </>,
        )}
        {sec(
          0.23,
          <>
            {label('Period')}
            {group(
              'Period',
              (['24h', '7d', '30d'] as const).map((p) => (
                <Chip
                  key={p}
                  on={!f.day && f.period === p}
                  onClick={() => set({ period: p, day: null })}
                >
                  {{ '24h': '24 h', '7d': '7 days', '30d': '30 days' }[p]}
                </Chip>
              )),
            )}
          </>,
        )}
        {sec(
          0.28,
          <>
            {label('Time of day')}
            {group(
              'Time of day',
              (['any', 'dawn', 'day', 'dusk', 'night'] as const).map((t) => (
                <Chip key={t} on={f.tod === t} onClick={() => set({ tod: t })}>
                  {t[0].toUpperCase() + t.slice(1)}
                </Chip>
              )),
            )}
          </>,
        )}
        {staff &&
          sec(
            0.33,
            <>
              {label('Classification')}
              {group(
                'Classification',
                (
                  [
                    ['all', 'All'],
                    ['IDENTIFIED', 'Identified'],
                    ['UNKNOWN', 'Unknown'],
                    ['NO_ANIMAL', 'No animal'],
                  ] as const
                ).map(([v, l]) => (
                  <Chip
                    key={v}
                    on={f.status === v}
                    onClick={() => set({ status: v })}
                  >
                    {l}
                  </Chip>
                )),
              )}
            </>,
          )}
        {staff &&
          sec(
            0.38,
            <>
              {label('Minimum score')}
              {group(
                'Minimum model score',
                (
                  [
                    [0, 'Any'],
                    [0.7, '≥ 0.70'],
                    [0.85, '≥ 0.85'],
                    [0.95, '≥ 0.95'],
                  ] as const
                ).map(([v, l]) => (
                  <Chip
                    key={v}
                    on={f.minScore === v}
                    onClick={() => set({ minScore: v })}
                  >
                    {l}
                  </Chip>
                )),
              )}
            </>,
          )}
        {sec(
          0.42,
          <>
            <span
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--muted)',
              }}
            >
              <span>Last 30 days</span>
              <span>
                {f.day
                  ? `${fmtDay(`${f.day}T12:00:00Z`)} · tap again to clear`
                  : 'tap a day'}
              </span>
            </span>
            <div
              role="group"
              aria-label="Sightings per day, last 30 days"
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 2,
                height: 38,
              }}
            >
              {buckets.map((b, i) => {
                const inPeriod = f.day
                  ? b.date === f.day
                  : i >= buckets.length - periodStart;
                return (
                  <button
                    key={b.date}
                    type="button"
                    title={`${fmtDay(`${b.date}T12:00:00Z`)} · ${b.sightings}`}
                    aria-label={`${fmtDay(`${b.date}T12:00:00Z`)}: ${b.sightings} sightings${b.date === today ? ' (today)' : ''}`}
                    aria-pressed={f.day === b.date}
                    onClick={() =>
                      set({ day: f.day === b.date ? null : b.date })
                    }
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: 0,
                      border: 0,
                      cursor: 'pointer',
                      borderRadius: '3px 3px 1px 1px',
                      height: `${Math.max(5, (b.sightings / maxDay) * 100).toFixed(1)}%`,
                      background: inPeriod
                        ? 'var(--mint)'
                        : 'rgba(190,227,201,0.16)',
                      transition: 'background .3s, height .5s var(--ios)',
                    }}
                  />
                );
              })}
            </div>
          </>,
          {
            marginTop: 'auto',
            paddingTop: 14,
            borderTop: '1px solid rgba(190,227,201,0.12)',
          },
        )}
      </div>
    </aside>
  );
}

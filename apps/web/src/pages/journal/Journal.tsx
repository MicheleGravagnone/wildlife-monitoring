import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router';
import {
  useDetections,
  useMe,
  useParkStats,
  useSpeciesStats,
} from '../../api/hooks';
import { isStaffDetection, type AnyDetection } from '../../api/types';
import { IconChevron, IconSearch } from '../../components/icons';
import { LoadError, statusText } from '../../components/ui';
import { useIsMobile, useNow } from '../../lib/hooks';
import { useSectionPeek, type PageSection } from '../../lib/sections';
import { ALL_PARKS_ART, PARKS } from '../../lib/parks';
import { speciesFor } from '../../lib/species';
import { fmtDay, fmtTime } from '../../lib/time';
import { labelOf, subLabelOf } from '../bubbles';
import { DetectionDrawer } from './DetectionDrawer';
import {
  readFilters,
  toQuery,
  writeFilters,
  type JournalFilters,
} from './filters';
import { FiltersIsland } from './FiltersIsland';

const SPRING = 'cubic-bezier(.34,1.3,.5,1)';
const FILTER_W = 280;

const SECTIONS: PageSection[] = [
  { id: 'wm-j-top', title: 'The field journal', photo: '/assets/pk-lag.jpg' },
  { id: 'wm-results', title: 'Sightings', photo: '/assets/sp-fox.jpg' },
];

export function Journal() {
  const mobile = useIsMobile();
  const { data: me } = useMe();
  const staff = !!me;
  const now = useNow(60_000);
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  useSectionPeek(SECTIONS);
  const selectedId = params.get('id');
  const [filtersOpen, setFiltersOpen] = useState(
    () => window.innerWidth >= 760,
  );

  const set = (patch: Partial<JournalFilters>) => {
    const next = {
      ...filters,
      page: 'page' in patch ? filters.page : 1,
      ...patch,
    };
    setParams(writeFilters(next, params), { replace: true });
  };
  const select = (id: string | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set('id', id);
    else p.delete('id');
    setParams(p, { replace: !id });
  };

  const [q, setQ] = useState(filters.q);
  useEffect(() => setQ(filters.q), [filters.q]);
  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => set({ q }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const pageSize = mobile ? 6 : 12;
  const query = toQuery(filters, staff, pageSize, now);
  const list = useDetections(query, me?.id ?? null);
  const species = useSpeciesStats({
    from: query.from,
    to: query.to,
    parkName: query.parkName,
  });
  const parks = useParkStats({
    from: query.from,
    to: query.to,
    species: query.species,
  });
  const items = (list.data?.items ?? []) as AnyDetection[];
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pg = Math.min(filters.page, pages);

  const setPage = (p: number) => {
    set({ page: p });
    document
      .getElementById('wm-results')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const padL = mobile ? 12 : filtersOpen ? 24 + FILTER_W + 28 : 24 + 64 + 28;
  const art = PARKS.find((p) => p.name === filters.park) ?? null;
  const credit = art ? art.credit : ALL_PARKS_ART.credit;
  const crownMask = `radial-gradient(ellipse ${mobile ? 250 : 600}px ${mobile ? 170 : 250}px at ${mobile ? padL + 160 : 428}px ${mobile ? 300 : 340}px, #000 45%, transparent 100%)`;
  const bandH = mobile ? 620 : 730;
  const bgImg: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: '50% 35%',
    transition: 'opacity .9s var(--ios), transform 1.6s var(--ios)',
  };
  const allArt = [
    { key: 'all', ...ALL_PARKS_ART },
    ...PARKS.map((p) => ({ key: p.name, ...p })),
  ];
  const currentKey = art?.name ?? 'all';

  const speciesSeen = species.data?.length ?? 0;
  const parksSeen =
    parks.data?.filter(
      (p) =>
        p.sightings > 0 &&
        (filters.park === 'all' || p.parkName === filters.park),
    ).length ?? 0;

  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: bandH,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
          WebkitMaskImage:
            'linear-gradient(180deg, #000 55%, transparent 100%)',
          maskImage: 'linear-gradient(180deg, #000 55%, transparent 100%)',
        }}
      >
        {allArt.map((a) => (
          <img
            key={a.key}
            src={a.photo}
            alt=""
            style={{
              ...bgImg,
              ...(a.key === currentKey
                ? { opacity: 1, transform: 'scale(1)', zIndex: 1 }
                : { opacity: 0, transform: 'scale(1.06)', zIndex: 0 }),
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background:
              'linear-gradient(90deg, rgba(11,23,17,0.62) 0%, rgba(11,23,17,0.12) 55%, rgba(11,23,17,0.4) 100%), linear-gradient(180deg, rgba(11,23,17,0.5) 0%, rgba(11,23,17,0.05) 28%, rgba(11,23,17,0.45) 70%, rgba(11,23,17,0.3) 100%)',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: bandH,
          overflow: 'hidden',
          zIndex: 2,
          pointerEvents: 'none',
          WebkitMaskImage: crownMask,
          maskImage: crownMask,
        }}
      >
        {allArt.map((a) => (
          <img
            key={a.key}
            src={a.crowns}
            alt=""
            style={{
              ...bgImg,
              filter: 'brightness(0.8)',
              ...(a.key === currentKey
                ? { opacity: 1, transform: 'scale(1)' }
                : { opacity: 0, transform: 'scale(1.06)' }),
            }}
          />
        ))}
      </div>

      <div
        style={
          mobile
            ? { display: 'contents' }
            : {
                position: 'absolute',
                left: 24,
                top: 100 + 500 + 18,
                bottom: 0,
                width: FILTER_W,
                zIndex: 60,
                pointerEvents: 'none',
              }
        }
      >
        <FiltersIsland
          filters={filters}
          set={set}
          staff={staff}
          open={filtersOpen}
          onToggle={() => setFiltersOpen((o) => !o)}
          hidden={!!selectedId}
        />
      </div>

      <div
        style={{
          position: 'relative',
          boxSizing: 'border-box',
          ...(mobile
            ? { padding: '84px 12px 150px' }
            : {
                padding: `100px 28px 70px ${padL}px`,
                transition: `padding-left .62s ${SPRING}`,
              }),
        }}
      >
        <section
          id="wm-j-top"
          aria-label="Field journal"
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            minHeight: mobile ? 440 : 500,
            boxSizing: 'border-box',
            paddingTop: mobile ? 28 : 36,
            ...(mobile
              ? {}
              : {
                  height: 500,
                  marginLeft: 28 - padL,
                  transition: `margin-left .62s ${SPRING}`,
                }),
          }}
        >
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.2em',
              color: 'var(--mint)',
            }}
          >
            {staff
              ? 'STAFF VIEW · ALL CLASSIFICATIONS'
              : 'PUBLIC · IDENTIFIED SIGHTINGS'}
          </span>
          <h1
            style={{
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: 'max-content',
              maxWidth: '100%',
              fontWeight: 400,
            }}
          >
            <span
              className="wm-rise"
              style={{
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: '#D7EEDD',
                marginLeft: mobile ? 4 : 10,
                fontSize: mobile ? 30 : 'clamp(36px, 3.6vw, 58px)',
              }}
            >
              the field
            </span>
            <span
              className="wm-rise"
              style={{
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 0.82,
                margin: mobile ? '6px 0' : '10px 0 8px',
                background: 'linear-gradient(180deg,#DDF1E2 0%,#A9D7B8 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontSize: mobile ? 76 : 'clamp(110px, 13vw, 214px)',
              }}
            >
              JOURNAL
            </span>
            <span
              style={{
                position: 'relative',
                zIndex: 3,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
                color: '#D7EEDD',
                alignSelf: 'flex-end',
                textAlign: 'right',
                fontSize: mobile ? 26 : 'clamp(30px, 3vw, 50px)',
              }}
            >
              {filters.park === 'all' ? 'of every park' : `of ${filters.park}`}
            </span>
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: 1.65,
              color: 'var(--text)',
              maxWidth: 480,
              position: 'relative',
              zIndex: 3,
            }}
          >
            {staff
              ? 'Every classified capture, including unknown and empty frames, with model scores and sensors. Click a card for the full record.'
              : 'Every identified animal our camera traps have met in Łódź parks. Search by species, or narrow it to a park, dawn, dusk or night.'}
          </p>
          <div
            style={{
              ...(mobile
                ? { position: 'relative', alignSelf: 'flex-start' }
                : { position: 'absolute', right: 0, bottom: 52, zIndex: 3 }),
              display: 'flex',
              padding: '14px 6px',
              borderRadius: 24,
              background: 'rgba(8,18,12,0.62)',
              border: '1px solid rgba(190,227,201,0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {(
              [
                [total, 'sightings'],
                [speciesSeen, 'species'],
                [parksSeen, 'parks'],
              ] as const
            ).map(([v, k], i) => (
              <span
                key={k}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: `0 ${mobile ? 16 : 22}px`,
                  ...(i
                    ? { borderLeft: '1px solid rgba(231,240,234,0.3)' }
                    : {}),
                }}
              >
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 300,
                    lineHeight: 1,
                    color: 'var(--cream)',
                  }}
                >
                  {v}
                </span>
                <span style={{ fontSize: 12, color: 'var(--body)' }}>{k}</span>
              </span>
            ))}
          </div>
          <span
            style={
              mobile
                ? { fontSize: 10, color: 'rgba(231,240,234,0.55)' }
                : {
                    position: 'absolute',
                    right: 0,
                    bottom: 18,
                    fontSize: 10,
                    color: 'rgba(231,240,234,0.6)',
                  }
            }
          >
            Photo · {credit}
          </span>
        </section>

        <div
          role="search"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            margin: '18px 0 26px',
          }}
        >
          <IconSearch
            style={{ position: 'absolute', left: 22, color: 'var(--muted)' }}
          />
          <label htmlFor="wm-q" className="sr-only">
            Search sightings
          </label>
          <input
            id="wm-q"
            type="search"
            placeholder={
              staff ? 'Search species, sensor or event ID' : 'Search a species…'
            }
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: '100%',
              height: 60,
              padding: '0 22px 0 56px',
              boxSizing: 'border-box',
              borderRadius: 999,
              border: '1px solid rgba(190,227,201,0.2)',
              background: 'rgba(16,34,26,0.75)',
              color: 'var(--text)',
              fontSize: 16,
            }}
          />
        </div>

        <div
          id="wm-results"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 14,
            scrollMarginTop: 100,
          }}
        >
          <span
            aria-live="polite"
            style={{ fontSize: 14, color: 'var(--body)' }}
          >
            Showing{' '}
            <span style={{ color: 'var(--cream)', fontWeight: 500 }}>
              {list.isPending
                ? '…'
                : total
                  ? `${(pg - 1) * pageSize + 1}–${(pg - 1) * pageSize + items.length} of ${total} sightings`
                  : '0 sightings'}
            </span>
          </span>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.14em',
              color: 'var(--muted)',
            }}
          >
            {
              {
                newest: 'NEWEST FIRST',
                oldest: 'OLDEST FIRST',
                species: 'SPECIES A–Z',
                confidence: 'HIGHEST SCORE',
              }[query.sort ?? 'newest']
            }
          </span>
        </div>

        {list.isError && (
          <LoadError what="sightings" onRetry={() => void list.refetch()} />
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${mobile ? 260 : 280}px, 1fr))`,
            gap: mobile ? 12 : 18,
            opacity: list.isPlaceholderData ? 0.6 : 1,
            transition: 'opacity .25s',
          }}
        >
          {list.isPending
            ? Array.from({ length: pageSize }, (_, i) => (
                <div
                  key={i}
                  className="wm-skeleton"
                  style={{ height: mobile ? 250 : 290, borderRadius: 26 }}
                />
              ))
            : items.map((d, i) => (
                <JournalCard
                  key={d.id}
                  d={d}
                  index={i}
                  anim={(pg + total) % 2 ? 'wm-cin-b' : 'wm-cin-a'}
                  onPick={() => select(d.id)}
                />
              ))}
        </div>
        {!list.isPending && !list.isError && total === 0 && (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: 18,
              fontWeight: 300,
            }}
          >
            Nothing stirred with these filters. Try a wider period or clear the
            search.
          </div>
        )}

        {pages > 1 && <Pager page={pg} pages={pages} onPage={setPage} />}
      </div>

      {selectedId && (
        <DetectionDrawer
          id={selectedId}
          fromList={items.find((d) => d.id === selectedId)}
          onClose={() => select(null)}
        />
      )}
    </div>
  );
}

function JournalCard({
  d,
  index,
  anim,
  onPick,
}: {
  d: AnyDetection;
  index: number;
  anim: string;
  onPick: () => void;
}) {
  const mobile = useIsMobile();
  const sp = speciesFor(d.speciesLabel);
  const staff = isStaffDetection(d);
  const glass: CSSProperties = {
    fontSize: 11,
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(11,23,17,0.62)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  };
  const status =
    staff && d.classificationStatus !== 'IDENTIFIED'
      ? d.classificationStatus
      : null;
  return (
    <button
      type="button"
      className={`wm-photo wm-jcard ${anim}`}
      onClick={onPick}
      aria-label={`${labelOf(d)}, ${fmtDay(d.capturedAt)} ${fmtTime(d.capturedAt)}, ${d.parkName}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: mobile ? 250 : 290,
        padding: 0,
        border: '1px solid rgba(190,227,201,0.12)',
        borderRadius: 26,
        background: 'var(--panel)',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--text)',
        animationDelay: `${(index * 0.045).toFixed(3)}s`,
      }}
    >
      {sp ? (
        <img
          src={sp.photo}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: sp.pos,
          }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'radial-gradient(circle at 50% 40%, #1E3A2C, #0E1E16)',
            fontSize: 54,
            fontWeight: 300,
            color: 'rgba(190,227,201,0.35)',
          }}
        >
          ?
        </span>
      )}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(0deg, rgba(6,14,10,0.92) 0%, rgba(6,14,10,0.35) 45%, rgba(6,14,10,0) 70%)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{ ...glass, fontFamily: 'var(--mono)', color: 'var(--text)' }}
        >
          {fmtDay(d.capturedAt)} · {fmtTime(d.capturedAt)}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          {status && (
            <span
              style={{
                ...glass,
                fontFamily: 'var(--mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: status === 'UNKNOWN' ? '#E6D08F' : '#F0A898',
              }}
            >
              {statusText(status)}
            </span>
          )}
          <span
            style={{
              ...glass,
              color: 'var(--mint)',
              textTransform: 'capitalize',
            }}
          >
            {staff && d.confidence != null
              ? `score ${d.confidence.toFixed(2)}`
              : d.timeOfDay}
          </span>
        </span>
      </span>
      <span
        style={{
          position: 'absolute',
          left: 18,
          right: 16,
          bottom: 16,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 21,
              fontWeight: 500,
              lineHeight: 1.1,
              color: 'var(--cream)',
            }}
          >
            {labelOf(d)}
          </span>
          <span
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              fontWeight: 300,
              color: 'var(--label)',
            }}
          >
            {subLabelOf(d)}
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              marginTop: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {staff
              ? `${d.parkName} · ${d.deploymentName} · ${d.deviceId}`
              : `near ${d.parkName}`}
          </span>
        </span>
        <span
          className="wm-go"
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            flex: 'none',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            border: '1px solid rgba(231,240,234,0.5)',
            color: 'var(--text)',
          }}
        >
          <IconChevron />
        </span>
      </span>
    </button>
  );
}

function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  const n = Math.min(pages, 9);
  const start = Math.max(1, Math.min(page - 4, pages - n + 1));
  const arrow = (on: boolean): CSSProperties => ({
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    cursor: on ? 'pointer' : 'default',
    background: 'transparent',
    border: `1px solid rgba(190,227,201,${on ? 0.35 : 0.12})`,
    color: on ? 'var(--text)' : '#5E7466',
  });
  return (
    <nav
      aria-label="Pages"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
        marginTop: 30,
      }}
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        style={arrow(page > 1)}
      >
        <IconChevron dir="left" />
      </button>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {Array.from({ length: n }, (_, k) => {
          const p = start + k;
          const cur = p === page;
          return (
            <button
              key={p}
              type="button"
              aria-label={`Page ${p} of ${pages}`}
              aria-current={cur ? 'page' : undefined}
              onClick={() => onPage(p)}
              style={{
                height: 44,
                padding: '0 3px',
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <span
                style={{
                  display: 'block',
                  height: 6,
                  borderRadius: 3,
                  transition: `width .45s ${SPRING}, background .3s`,
                  width: cur ? 28 : 6,
                  background: cur ? 'var(--mint)' : 'rgba(190,227,201,0.28)',
                }}
              />
            </button>
          );
        })}
      </span>
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        style={arrow(page < pages)}
      >
        <IconChevron />
      </button>
    </nav>
  );
}

import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { useBubbleProps } from '../../components/Bubble';
import { eyebrow } from '../../components/ui';
import { useIsMobile, useIsTablet } from '../../lib/hooks';
import { SPECIES } from '../../lib/species';
import { parkBubble, speciesBubble } from '../bubbles';
import { h2Style, type OverviewData } from './Overview';

const HABITATS = [
  {
    park: 'Las Łagiewnicki',
    latin: 'habitat · forest pond',
    photo: '/assets/hab-lagiewniki.jpg',
    alt: 'A still forest pond in Las Łagiewnicki in early spring',
    pos: '50% 55%',
  },
  {
    park: 'Arturówek',
    latin: 'habitat · sunlit woodland',
    photo: '/assets/hab-arturowek.jpg',
    alt: 'Sunlit woodland and a path near the Arturówek ponds',
    pos: '45% 50%',
  },
];

const SLOTS: ['hab' | 'sp', number, number, number, number, number, number][] =
  [
    ['hab', 0, 32, 0, 28, 320, 1],
    ['sp', 3, 63, 40, 19, 330, 2],
    ['sp', 7, 85, 0, 15, 290, 2],
    ['sp', 0, 30, 290, 32, 470, 3],
    ['sp', 5, 80, 350, 20, 380, 3],
    ['sp', 1, 57, 470, 30, 340, 4],
    ['sp', 2, 0, 500, 22, 480, 2],
    ['sp', 4, 0, 960, 26, 260, 3],
    ['hab', 1, 20, 740, 38, 360, 4],
    ['sp', 6, 56, 800, 44, 360, 5],
  ];
const MOBILE: [number, number, number, number][] = [
  [1, 2, 300, 0],
  [1, 1, 240, 0],
  [2, 1, 260, 40],
  [1, 1, 280, -20],
  [2, 1, 240, 20],
  [1, 2, 260, 0],
  [1, 1, 250, 0],
  [2, 1, 230, 30],
  [1, 1, 240, 0],
  [2, 1, 250, 30],
];
const TABLET: [number, number][] = [
  [2, 320],
  [1, 320],
  [1, 280],
  [1, 280],
  [1, 280],
  [1, 300],
  [2, 300],
  [1, 260],
  [1, 260],
  [1, 260],
];
const RADII = [
  '28px 28px 28px 6px',
  '6px 28px 28px 28px',
  '28px 6px 28px 28px',
  '28px 28px 6px 28px',
];

export function Guide({ data, gp }: { data: OverviewData; gp: number }) {
  const phone = useIsMobile();
  const tablet = useIsTablet();
  const mobile = phone || tablet;
  const navigate = useNavigate();
  const stats = data.species ?? [];
  const count = (label: string) =>
    stats.find((s) => s.speciesLabel === label)?.sightings ?? 0;
  const sorted = SPECIES.map((s) => ({ s, n: count(s.label) })).sort(
    (a, b) => b.n - a.n,
  );

  return (
    <div
      className={mobile ? undefined : 'wm-collage'}
      style={
        mobile
          ? {
              display: 'grid',
              gridTemplateColumns: `repeat(${tablet ? 3 : 2}, minmax(0, 1fr))`,
              gap: tablet ? 16 : 12,
              alignItems: 'start',
            }
          : { position: 'relative', height: 1230 }
      }
    >
      <div
        style={
          mobile
            ? {
                gridColumn: '1 / -1',
                marginBottom: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
                minWidth: 0,
              }
            : {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '30%',
                zIndex: 6,
                paddingTop: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
              }
        }
      >
        <span style={eyebrow}>01 — FIELD GUIDE</span>
        <h2 style={h2Style(mobile)}>
          Who shares
          <br />
          the parks
          <br />
          <span
            style={{
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'var(--mint)',
            }}
          >
            with us
          </span>
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.7,
            color: 'var(--body)',
            maxWidth: 340,
          }}
        >
          Eight mammals, and the woods and ponds they call home. Hover a
          portrait for its daily rhythm and favourite park in the{' '}
          {data.rangeLower}; click to read every sighting.
        </p>
      </div>
      {SLOTS.map((sl, i) => {
        const [kind, idx, left, top, width, height, z] = sl;
        const m = MOBILE[i];
        const hab = kind === 'hab' ? HABITATS[idx] : null;
        const sp = kind === 'sp' ? sorted[idx] : null;
        return (
          <GuideCard
            key={i}
            num={String(i + 1).padStart(2, '0')}
            title={hab ? hab.park : sp!.s.label}
            latin={hab ? hab.latin : sp!.s.latin}
            photo={hab ? hab.photo : sp!.s.photo}
            alt={hab ? hab.alt : sp!.s.alt}
            pos={hab ? hab.pos : sp!.s.pos}
            countLabel={
              hab
                ? `${data.parks?.find((p) => p.parkName === hab.park)?.sightings ?? 0} sightings`
                : sp!.n
                  ? `${sp!.n} seen`
                  : 'not seen lately'
            }
            dim={!hab && !sp!.n}
            big={tablet ? TABLET[i][0] >= 2 : mobile ? m[1] >= 2 : width >= 28}
            bubble={() =>
              hab
                ? parkBubble(
                    data.parks?.find((p) => p.parkName === hab.park),
                    hab.park,
                    data.rangeLower,
                    data.now,
                  )
                : speciesBubble(
                    stats.find((s) => s.speciesLabel === sp!.s.label),
                    sp!.s.label,
                    data.rangeLower,
                  )
            }
            onPick={() =>
              navigate(
                hab
                  ? `/journal?park=${encodeURIComponent(hab.park)}`
                  : `/journal?species=${encodeURIComponent(sp!.s.label)}`,
              )
            }
            radius={RADII[i % 4]}
            place={
              tablet
                ? {
                    position: 'relative',
                    gridColumn: `span ${TABLET[i][0]}`,
                    height: TABLET[i][1],
                  }
                : mobile
                  ? {
                      position: 'relative',
                      gridColumn: `${m[0]} / span ${m[1]}`,
                      height: m[2],
                      marginTop: m[3],
                    }
                  : {
                      position: 'absolute',
                      left: `${left}%`,
                      top,
                      width: `${width}%`,
                      height,
                      zIndex: z,
                      translate: `0 ${(gp * (z - 2.5) * 38).toFixed(1)}px`,
                      transition:
                        'translate .16s linear, transform .6s cubic-bezier(.34,1.3,.5,1), box-shadow .6s',
                    }
            }
            imgShift={mobile ? null : (-gp * 34).toFixed(1)}
            mobile={mobile}
          />
        );
      })}
    </div>
  );
}

function GuideCard(p: {
  num: string;
  title: string;
  latin: string;
  photo: string;
  alt: string;
  pos: string;
  countLabel: string;
  dim: boolean;
  big: boolean;
  bubble: () => ReturnType<typeof speciesBubble>;
  onPick: () => void;
  radius: string;
  place: CSSProperties;
  imgShift: string | null;
  mobile: boolean;
}) {
  const bubble = useBubbleProps(p.bubble);
  return (
    <button
      type="button"
      className="wm-photo"
      onClick={p.onPick}
      {...bubble}
      style={{
        ...p.place,
        overflow: 'hidden',
        padding: 0,
        border: 0,
        cursor: 'pointer',
        textAlign: 'left',
        background: 'var(--panel)',
        boxShadow: '0 30px 60px -24px rgba(0,0,0,0.75)',
        borderRadius: p.radius,
        ...(p.dim ? { filter: 'grayscale(0.7)' } : {}),
      }}
    >
      <img
        src={p.photo}
        alt={p.alt}
        loading="lazy"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: p.pos,
          ...(p.imgShift !== null
            ? {
                scale: '1.18',
                translate: `0 ${p.imgShift}px`,
                transition:
                  'translate .16s linear, transform .9s cubic-bezier(.2,.9,.25,1), filter .9s',
              }
            : {}),
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(0deg, rgba(6,14,10,0.9) 0%, rgba(6,14,10,0.05) 55%)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          padding: '5px 9px',
          borderRadius: 999,
          background: 'rgba(11,23,17,0.6)',
          color: 'var(--mint)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        {p.num} · {p.countLabel}
      </span>
      <span
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontWeight: 500,
            lineHeight: 1.05,
            color: 'var(--cream)',
            fontSize: p.big ? (p.mobile ? 28 : 34) : 22,
          }}
        >
          {p.title}
        </span>
        <span
          style={{
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 13,
            color: 'var(--label)',
          }}
        >
          {p.latin}
        </span>
        <span
          className="wm-reveal"
          style={{ fontSize: 12, color: 'var(--mint)', marginTop: 6 }}
        >
          Open in the journal →
        </span>
      </span>
    </button>
  );
}

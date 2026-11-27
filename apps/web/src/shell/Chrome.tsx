import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { useLogout, useMe } from '../api/hooks';
import { BrandMark, IconLock } from '../components/icons';
import { useSignIn } from '../components/SignIn';
import { useIsMobile } from '../lib/hooks';

export function Backdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <img
        src="/assets/bg-canopy.jpg"
        alt=""
        style={{
          position: 'absolute',
          left: '-3%',
          top: '-3%',
          width: '106%',
          height: '106%',
          objectFit: 'cover',
        }}
      />
      <img
        className="wm-dapplebg"
        src="/assets/bg-dapple.jpg"
        alt=""
        style={{
          position: 'absolute',
          left: '-8%',
          top: '-8%',
          width: '116%',
          height: '116%',
          objectFit: 'cover',
          mixBlendMode: 'screen',
          opacity: 0.11,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(90% 60% at 75% 0%, rgba(190,227,201,0.07), rgba(190,227,201,0) 60%), radial-gradient(70% 60% at 10% 100%, rgba(120,90,50,0.08), rgba(120,90,50,0) 70%), linear-gradient(180deg, rgba(8,17,12,0.25), rgba(8,17,12,0.55))',
        }}
      />
    </div>
  );
}

export function Brand({
  onLanding,
  compact = false,
}: {
  onLanding: boolean;
  compact?: boolean;
}) {
  const mobile = useIsMobile();
  const pos: CSSProperties = mobile
    ? { top: 30, left: 30 }
    : { top: onLanding ? 62 : 40, left: onLanding ? 62 : 40 };
  return (
    <Link
      to="/"
      aria-label="Trop, wildlife monitor: overview"
      style={{
        position: 'absolute',
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        ...pos,
      }}
    >
      <BrandMark />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}
        >
          Trop
          {!compact && (
            <span
              style={{
                color: 'var(--mint)',
                fontWeight: 300,
                fontSize: 17,
                letterSpacing: 0,
              }}
            >
              {' '}
              — wildlife monitor
            </span>
          )}
        </span>
        {!mobile && !compact && (
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: '0.2em',
              color: 'var(--muted)',
              marginTop: 5,
            }}
          >
            ŁÓDŹ · 51.76°N 19.46°E
          </span>
        )}
      </span>
    </Link>
  );
}

const ROLE_LABEL = {
  ADMINISTRATOR: 'Administrator',
  DEVELOPER: 'Developer',
} as const;

export function Account({
  onLanding,
  compact = false,
}: {
  onLanding: boolean;
  compact?: boolean;
}) {
  const mobile = useIsMobile();
  const small = mobile || compact;
  const { data: me } = useMe();
  const logout = useLogout();
  const { openSignIn } = useSignIn();
  const pos: CSSProperties = mobile
    ? { top: 26, right: 26 }
    : { top: onLanding ? 58 : 36, right: onLanding ? 62 : 40 };
  const glass: CSSProperties = {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  return (
    <div style={{ position: 'absolute', zIndex: 70, ...pos }}>
      {me ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 42,
            padding: '0 4px 0 6px',
            borderRadius: 999,
            background: 'rgba(11,23,17,0.6)',
            border: '1px solid rgba(190,227,201,0.25)',
            ...glass,
          }}
        >
          <span
            title={`${me.name} ${me.surname}`}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--mint)',
              color: 'var(--bg)',
              fontSize: 11,
              fontWeight: 700,
              flex: 'none',
            }}
          >
            {(me.name[0] ?? '') + (me.surname[0] ?? '')}
          </span>
          {!small && (
            <span style={{ fontSize: 12 }}>{ROLE_LABEL[me.role]}</span>
          )}
          <button
            type="button"
            onClick={() => logout.mutate()}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 999,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openSignIn()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 42,
            padding: '0 16px',
            borderRadius: 999,
            cursor: 'pointer',
            fontSize: 13,
            border: '1px solid rgba(190,227,201,0.35)',
            background: 'rgba(11,23,17,0.45)',
            color: 'var(--text)',
            ...glass,
          }}
        >
          <IconLock />
          <span>{small ? 'Staff' : 'Staff sign in'}</span>
        </button>
      )}
    </div>
  );
}

export const CREDITS = [
  {
    what: 'Forest aerial',
    artist: 'Marcinjozwiak',
    lic: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Poland_forests.jpg',
  },
  {
    what: 'Red fox',
    artist: 'ClaudiaTen',
    lic: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Portrait_of_a_red_fox_in_Rautas_fj%C3%A4llurskog.jpg',
  },
  {
    what: 'Roe deer',
    artist: 'Tjustorparn',
    lic: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:R%C3%A5bock_i_n%C3%A4rbild.jpg',
  },
  {
    what: 'Red squirrel',
    artist: 'Jakub Hałun',
    lic: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Wiewi%C3%B3rka_w_Parku_Bednarskiego_w_Krakowie,_20241117_0903_2741.jpg',
  },
  {
    what: 'Hedgehog',
    artist: 'Hrald',
    lic: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:West_European_Hedgehog_(Erinaceus_europaeus)1.jpg',
  },
  {
    what: 'Wild boar',
    artist: 'Michael Gäbler',
    lic: 'CC BY 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:A_young_wild_boar_in_his_environment.jpg',
  },
  {
    what: 'Badger',
    artist: 'Charles J. Sharp',
    lic: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:European_badger_(Meles_meles_taxus)_Drenthe.jpg',
  },
  {
    what: 'Stone marten',
    artist: 'Charles J. Sharp',
    lic: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Stone_marten_(Martes_foina)_Drenthe.jpg',
  },
  {
    what: 'Hare',
    artist: 'Charles J. Sharp',
    lic: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:European_hare_(Lepus_europaeus)_Marken.jpg',
  },
  {
    what: 'Las Łagiewnicki',
    artist: 'Blackrainbow000',
    lic: 'CC BY-SA 3.0 PL',
    page: 'https://commons.wikimedia.org/wiki/File:Las_%C5%81agiewnicki.JPG',
  },
  {
    what: 'Forest near Arturówek',
    artist: 'Jaruh Art',
    lic: 'CC BY-SA 3.0 PL',
    page: 'https://commons.wikimedia.org/wiki/File:Widok_z_lasu_na_staw_przy_Wycieczkowej.jpg',
  },
  {
    what: 'Park na Zdrowiu',
    artist: 'Darekm135',
    lic: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Park_na_Zdrowiu_w_%C5%81odzi.JPG',
  },
  {
    what: 'Ogród Botaniczny',
    artist: 'Darekm135',
    lic: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Ogr%C3%B3d_Botaniczny_w_%C5%81odzi_(12).JPG',
  },
  {
    what: 'Park Julianowski',
    artist: 'Darek Sołtysiński',
    lic: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Park_Julianowski_-_stycze%C5%84_2012r._-_panoramio.jpg',
  },
  {
    what: 'Park Helenów',
    artist: 'Piastu',
    lic: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Stawy,_Park_Helen%C3%B3w,_%C5%81%C3%B3d%C5%BA_01.jpg',
  },
  {
    what: 'Park Staromiejski',
    artist: 'Аимаина хикари',
    lic: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:%C5%81%C3%B3d%C5%BA_Park_Staromiejski_05.jpg',
  },
  {
    what: 'Park Źródliska',
    artist: 'Stevenlodz',
    lic: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:%C5%81%C3%B3d%C5%BA_park_%C5%B9r%C3%B3dliska_(a).JPG',
  },
  {
    what: 'Park Poniatowskiego',
    artist: 'Darekm135',
    lic: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Park_Poniatowskiego_in_%C5%81%C3%B3d%C5%BA_(10).JPG',
  },
  {
    what: 'Park im. 3 Maja',
    artist: 'Rakoon',
    lic: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:20200621_113912_Park_3_Maja_in_%C5%81%C3%B3d%C5%BA_June_2020.jpg',
  },
];

export function Footer() {
  const mobile = useIsMobile();
  return (
    <footer
      style={{
        maxWidth: 1360,
        margin: '0 auto',
        boxSizing: 'border-box',
        padding: mobile ? '20px 16px 120px' : '20px 40px 60px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 24,
          paddingTop: 28,
          borderTop: '1px solid var(--hairline)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxWidth: 320,
          }}
        >
          <span
            style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            Trop
            <span
              style={{
                fontWeight: 300,
                fontSize: 19,
                letterSpacing: 0,
                color: 'var(--mint)',
              }}
            >
              {' '}
              — wildlife monitor
            </span>
          </span>
          <span
            style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}
          >
            Research Based Workshop · AY 2026/27. Species and park photographs
            are reference images, not camera captures.
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: '1 1 420px',
            maxWidth: 760,
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
            PHOTOGRAPHS · WIKIMEDIA COMMONS
          </span>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 16px',
              fontSize: 11,
              color: 'var(--muted)',
              lineHeight: 1.6,
            }}
          >
            {CREDITS.map((c) => (
              <a
                key={c.what}
                href={c.page}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--muted)', textDecoration: 'none' }}
              >
                {c.what}: {c.artist}, {c.lic}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

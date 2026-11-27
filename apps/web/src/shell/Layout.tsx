import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  type Location,
} from 'react-router';
import { useMe } from '../api/hooks';
import { Loader } from '../components/Loader';
import { useSignIn } from '../components/SignIn';
import { useIsMobile, useViewportWidth } from '../lib/hooks';
import { landing, useStore } from '../lib/store';
import { Journal } from '../pages/journal/Journal';
import { Overview } from '../pages/overview/Overview';
import { Sensors } from '../pages/Sensors';
import { StaffOnly } from '../pages/StaffOnly';
import { System } from '../pages/System';
import { Account, Backdrop, Brand } from './Chrome';
import { fitChrome } from './chromeFit';
import { Island } from './Island';
import { PAGE_ORDER, pageForPath } from './pages';

const Live = lazy(() => import('../pages/live/Live'));

type Dir = 'fwd' | 'back';
export type LivePhase = 'enter' | 'in' | 'out';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const { data: me, isPending: mePending } = useMe();
  const { openSignIn } = useSignIn();
  const isLivePath = location.pathname === '/live';

  const [shown, setShown] = useState<Location>(() =>
    isLivePath
      ? { ...location, pathname: '/', search: '', hash: '' }
      : location,
  );
  const [leaving, setLeaving] = useState<Dir | null>(null);
  const [dir, setDir] = useState<Dir>('fwd');
  const [entered, setEntered] = useState<string | null>(() => shown.pathname);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (isLivePath) return;
    if (location.pathname === shown.pathname) {
      if (location.search !== shown.search || location.hash !== shown.hash)
        setShown(location);
      return;
    }
    const from = PAGE_ORDER.indexOf(pageForPath(shown.pathname));
    const to = PAGE_ORDER.indexOf(pageForPath(location.pathname));
    const d: Dir = to >= from ? 'fwd' : 'back';
    setLeaving(d);
    setDir(d);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setShown(location);
      setLeaving(null);
      window.scrollTo(0, 0);
    }, 200);
    return () => clearTimeout(timer.current);
  }, [location, isLivePath, shown]);

  const [livePhase, setLivePhase] = useState<LivePhase | null>(null);
  const liveAllowed = isLivePath && !!me;
  useEffect(() => {
    if (liveAllowed) {
      setLivePhase('enter');
      const t = setTimeout(() => setLivePhase('in'), 60);
      return () => clearTimeout(t);
    }
    setLivePhase((p) => (p ? 'out' : null));
    const t = setTimeout(() => setLivePhase(null), 950);
    return () => clearTimeout(t);
  }, [liveAllowed]);

  const backPath = `${shown.pathname}${shown.search}`;
  const exitLive = useCallback(() => navigate(backPath), [navigate, backPath]);

  useEffect(() => {
    if (isLivePath && !mePending && !me)
      openSignIn('/live', () => navigate(backPath, { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLivePath, mePending, me]);

  const page = pageForPath(shown.pathname);
  const landingActive = useStore(landing, (s) => s.active);
  const onLanding =
    page === 'overview' && !leaving && livePhase !== 'in' && landingActive;
  const liveIn = livePhase === 'in';
  const width = useViewportWidth();
  const fit = mobile
    ? { islandCompact: false, cornersCompact: false }
    : fitChrome(width, !!me, onLanding);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        ...(livePhase ? { height: '100vh', overflow: 'hidden' } : {}),
      }}
    >
      <a href="#main" className="sr-only" style={{ position: 'absolute' }}>
        Skip to content
      </a>
      <Backdrop />
      <Brand onLanding={onLanding} compact={fit.cornersCompact} />
      <Account onLanding={onLanding} compact={fit.cornersCompact} />
      <Island
        compact={fit.islandCompact}
        page={page}
        isLive={liveAllowed}
        leaving={!!leaving}
        exitLive={exitLive}
      />

      <main
        id="main"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'block',
          transformOrigin: `50% ${mobile ? '100%' : '0'}`,
          transition:
            'transform 1.1s cubic-bezier(.77,0,.18,1), filter 1.1s ease, opacity 1.1s ease',
          ...(liveIn
            ? {
                transform: 'scale(1.05)',
                filter: 'blur(10px) brightness(.5)',
                opacity: 0.35,
              }
            : {}),
        }}
        aria-hidden={liveIn || undefined}
      >
        <div
          key={shown.pathname}
          className={
            leaving
              ? `wm-pg-out-${leaving}`
              : entered === shown.pathname
                ? undefined
                : `wm-pg-in-${dir}`
          }
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && !leaving)
              setEntered(shown.pathname);
          }}
        >
          <Routes location={shown}>
            <Route path="/" element={<Overview />} />
            <Route path="/journal" element={<Journal />} />
            <Route
              path="/sensors"
              element={
                <StaffOnly what="Sensor health" next="/sensors">
                  <Sensors />
                </StaffOnly>
              }
            />
            <Route
              path="/system"
              element={
                <StaffOnly what="The capture pipeline" next="/system">
                  <System />
                </StaffOnly>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      {livePhase && (
        <Suspense
          fallback={
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
              <Loader overlay label="Loading the live canopy" />
            </div>
          }
        >
          <Live phase={livePhase} onExit={exitLive} />
        </Suspense>
      )}
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'grid',
        placeItems: 'center',
        padding: '140px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--mint)',
          }}
        >
          404
        </span>
        <span style={{ fontSize: 18, fontWeight: 300 }}>
          Nothing lives at this address.
        </span>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            height: 46,
            padding: '0 22px',
            borderRadius: 999,
            border: 0,
            background: 'var(--cream)',
            color: 'var(--bg)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Back to the overview
        </button>
      </div>
    </div>
  );
}

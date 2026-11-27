import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import { ApiRequestError } from '../api/client';
import { useLogin } from '../api/hooks';
import { useEscape } from '../lib/hooks';

interface SignInApi {
  openSignIn: (next?: string, onCancel?: () => void) => void;
}

const Ctx = createContext<SignInApi>({ openSignIn: () => {} });
export const useSignIn = () => useContext(Ctx);

export function SignInProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    next?: string;
    onCancel?: () => void;
  } | null>(null);
  const openSignIn = useCallback(
    (next?: string, onCancel?: () => void) => setState({ next, onCancel }),
    [],
  );
  const api = useMemo(() => ({ openSignIn }), [openSignIn]);
  return (
    <Ctx.Provider value={api}>
      {children}
      {state && (
        <SignInSheet
          next={state.next}
          onClose={(cancelled) => {
            setState(null);
            if (cancelled) state.onCancel?.();
          }}
        />
      )}
    </Ctx.Provider>
  );
}

const input = {
  height: 46,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid rgba(11,23,17,0.2)',
  background: '#FFFFFF',
  fontSize: 14,
  color: '#0B1711',
} as const;

function SignInSheet({
  next,
  onClose,
}: {
  next?: string;
  onClose: (cancelled: boolean) => void;
}) {
  const login = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const cancel = useCallback(() => onClose(true), [onClose]);
  useEscape(true, cancel);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    emailRef.current?.focus({ preventScroll: true });
    return () => prev?.focus?.({ preventScroll: true });
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          onClose(false);
          if (next) setTimeout(() => navigate(next), 250);
        },
      },
    );
  };

  const err = login.error;
  const message =
    err instanceof ApiRequestError && err.status === 401
      ? 'That email and password don’t match.'
      : err instanceof ApiRequestError && err.status === 429
        ? 'Too many attempts. Wait a minute and try again.'
        : err
          ? 'Couldn’t sign in. Check your connection and try again.'
          : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        boxSizing: 'border-box',
        background: 'rgba(4,10,7,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-title"
        className="wm-fadein"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 760,
          display: 'flex',
          flexWrap: 'wrap',
          borderRadius: 30,
          background: '#F2F1EC',
          padding: 8,
          boxSizing: 'border-box',
          boxShadow: '0 50px 100px -30px rgba(0,0,0,0.8)',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 260px',
            minHeight: 220,
            borderRadius: 24,
            overflow: 'hidden',
          }}
        >
          <img
            src="/assets/sp-deer.jpg"
            alt="A roe deer buck looking straight at the camera"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(0deg, rgba(6,14,10,0.8), rgba(6,14,10,0) 60%)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 20,
              bottom: 18,
              right: 20,
              fontSize: 30,
              fontWeight: 300,
              lineHeight: 1.05,
              color: '#F2F1EC',
            }}
          >
            step into the{' '}
            <span style={{ fontWeight: 700, color: '#BEE3C9' }}>LIVE</span>{' '}
            canopy
          </span>
        </div>
        <form
          onSubmit={submit}
          style={{
            flex: '1 1 300px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            padding: '22px 22px 18px',
            color: '#0B1711',
          }}
        >
          <h2
            id="signin-title"
            style={{
              margin: 0,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '0.18em',
              color: '#B5412F',
            }}
          >
            STAFF ACCESS
          </h2>
          <span style={{ fontSize: 13, color: '#3E5246', lineHeight: 1.55 }}>
            The live 3D map, sensor health and pipeline status are for park
            administrators, city officials and developers.
          </span>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 12,
              color: '#3E5246',
            }}
          >
            Work email
            <input
              ref={emailRef}
              type="email"
              required
              autoComplete="username"
              placeholder="you@example.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
            />
          </label>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 12,
              color: '#3E5246',
            }}
          >
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
            />
          </label>
          {message && (
            <span role="alert" style={{ fontSize: 13, color: '#9E3423' }}>
              {message}
            </span>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={cancel}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 999,
                border: '1px solid rgba(11,23,17,0.25)',
                background: 'transparent',
                color: '#0B1711',
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
            <button
              type="submit"
              disabled={login.isPending}
              style={{
                flex: 1.4,
                height: 48,
                borderRadius: 999,
                border: 0,
                background: '#B5412F',
                color: '#FFFFFF',
                cursor: login.isPending ? 'progress' : 'pointer',
                fontWeight: 500,
                opacity: login.isPending ? 0.75 : 1,
              }}
            >
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

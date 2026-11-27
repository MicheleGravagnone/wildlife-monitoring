import { useEffect, useState, useSyncExternalStore } from 'react';

export const MOBILE_MAX = 759;
const mobileQuery = `(max-width: ${MOBILE_MAX}px)`;

function subscribeMedia(cb: () => void) {
  const mq = window.matchMedia(mobileQuery);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia(mobileQuery).matches,
    () => false,
  );
}

function subscribeResize(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}

export function useViewportWidth(): number {
  return useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => 1440,
  );
}

export const TABLET_MAX = 1179;

export function useIsTablet(): boolean {
  const w = useViewportWidth();
  return w > MOBILE_MAX && w <= TABLET_MAX;
}

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useEscape(active: boolean, onKey: () => void) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKey();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active, onKey]);
}

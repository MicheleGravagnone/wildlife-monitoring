import type { CSSProperties } from 'react';

export function Loader({
  label = 'Loading',
  size = 72,
  overlay = false,
  visible = true,
}: {
  label?: string;
  size?: number;
  overlay?: boolean;
  visible?: boolean;
}) {
  const wrap: CSSProperties = overlay
    ? {
        position: 'absolute',
        inset: 0,
        zIndex: 3,
        background: 'var(--bg)',
        transition: 'opacity .6s var(--ios)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }
    : {};
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible || undefined}
      className="wm-loader"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        ...wrap,
      }}
    >
      <span className="wm-loader-mark" style={{ width: size, height: size }}>
        <span className="wm-loader-arc" />
        <img src="/assets/logo.png" alt="" />
      </span>
      <span className="wm-loader-label">{label}…</span>
    </div>
  );
}

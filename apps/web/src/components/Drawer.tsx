import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useEscape, useIsMobile } from '../lib/hooks';
import { IconClose } from './icons';

export function Drawer({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const mobile = useIsMobile();
  const ref = useRef<HTMLElement>(null);
  useEscape(true, onClose);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => prev?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!mobile) return;
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = o;
    };
  }, [mobile]);

  return createPortal(
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close details"
        tabIndex={-1}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 85,
          border: 0,
          padding: 0,
          background: 'rgba(4,10,7,0.55)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          cursor: 'default',
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          pointerEvents: 'none',
          perspective: 1400,
        }}
      >
        <aside
          ref={ref}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={mobile ? 'wm-sheetin' : 'wm-cardin'}
          style={{
            position: 'absolute',
            pointerEvents: 'auto',
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            boxSizing: 'border-box',
            overflowY: 'auto',
            color: 'var(--text)',
            background: 'var(--panel)',
            border: '8px solid #F2F1EC',
            boxShadow: '0 40px 90px -20px rgba(0,0,0,0.8)',
            ...(mobile
              ? {
                  left: 0,
                  right: 0,
                  bottom: 0,
                  maxHeight: '86vh',
                  padding: '8px 8px 30px',
                  borderRadius: '30px 30px 0 0',
                  borderBottom: 0,
                }
              : {
                  top: 84,
                  right: 16,
                  bottom: 16,
                  width: 440,
                  padding: '8px 8px 24px',
                  borderRadius: 32,
                }),
          }}
        >
          {children}
        </aside>
      </div>
    </>,
    document.body,
  );
}

export function CloseButton({
  onClick,
  style,
}: {
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: 0,
        background: '#F2F1EC',
        color: '#0B1711',
        cursor: 'pointer',
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        ...style,
      }}
    >
      <IconClose />
    </button>
  );
}

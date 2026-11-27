import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, props: P): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...props,
});

export const IconOverview = ({ size = 17, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M3 20l6-10 4 6 3-4 5 8z" />
    <circle cx="17" cy="6" r="2" />
  </svg>
);
export const IconJournal = ({ size = 17, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
    <path d="M9 9h6M9 13h4" />
  </svg>
);
export const IconCamera = ({ size = 17, ...p }: P) => (
  <svg {...base(size, p)}>
    <rect x="3" y="7" width="18" height="13" rx="3" />
    <circle cx="12" cy="13.5" r="3.5" />
    <path d="M8 7l1.5-3h5L16 7" />
  </svg>
);
export const IconSystem = ({ size = 17, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="5" cy="12" r="2.5" />
    <circle cx="19" cy="6" r="2.5" />
    <circle cx="19" cy="18" r="2.5" />
    <path d="M7.3 11l9.4-4M7.3 13l9.4 4" />
  </svg>
);
export const IconLock = ({ size = 14, ...p }: P) => (
  <svg {...base(size, { strokeWidth: 1.8, ...p })}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const IconChevron = ({
  size = 16,
  dir = 'right',
  ...p
}: P & { dir?: 'left' | 'right' | 'down' }) => (
  <svg {...base(size, { strokeWidth: 2, ...p })}>
    <path
      d={
        dir === 'left'
          ? 'M15 6l-6 6 6 6'
          : dir === 'down'
            ? 'M6 9l6 6 6-6'
            : 'M9 6l6 6-6 6'
      }
    />
  </svg>
);
export const IconClose = ({ size = 16, ...p }: P) => (
  <svg {...base(size, { strokeWidth: 2, ...p })}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconSearch = ({ size = 20, ...p }: P) => (
  <svg {...base(size, { strokeWidth: 1.8, ...p })}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);
export const IconFilters = ({ size = 22, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
    <circle cx="15" cy="6" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);
export const IconPlay = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M7 4.5v15l12-7.5z" />
  </svg>
);
export const IconPause = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

export function BrandMark({ size = 36 }: { size?: number }) {
  const drawn = Math.round(size * 1.6);
  const bleed = (drawn - size) / 2;
  return (
    <img
      src="/assets/logo.png"
      alt=""
      aria-hidden="true"
      width={drawn}
      height={drawn}
      style={{ display: 'block', flex: 'none', margin: -bleed }}
    />
  );
}

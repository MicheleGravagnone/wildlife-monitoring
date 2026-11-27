import { useEffect, useState, type CSSProperties } from 'react';
import {
  useHourly,
  useParkStats,
  useSpeciesStats,
  useSummary,
} from '../../api/hooks';
import type {
  HourlyActivity,
  ParkStats,
  SpeciesStats,
  StatsSummary,
} from '../../api/types';
import { useIsMobile, useNow } from '../../lib/hooks';
import { useSectionPeek, type PageSection } from '../../lib/sections';
import { landing } from '../../lib/store';
import { rangeFrom, RANGE_WORDS, type Range } from '../../lib/time';
import { Footer } from '../../shell/Chrome';
import { Guide } from './Guide';
import { Hero } from './Hero';
import { MapSection } from './MapSection';
import { Rhythm } from './Rhythm';

const SECTIONS: PageSection[] = [
  { id: 'wm-top', title: 'Welcome', photo: '/assets/hero-forest.jpg' },
  { id: 'wm-guide', title: 'Field guide', photo: '/assets/sp-fox.jpg' },
  { id: 'wm-map', title: 'Where they move', photo: '/assets/sp-badger.jpg' },
  { id: 'wm-rhythm', title: 'The daily rhythm', photo: '/assets/sp-hare.jpg' },
];
const RANGES: Range[] = ['24h', '7d', '30d'];

export interface OverviewData {
  range: Range;
  rangeLower: string;
  now: number;
  summary: StatsSummary | undefined;
  species: SpeciesStats[] | undefined;
  parks: ParkStats[] | undefined;
  hourly: HourlyActivity | undefined;
}

export function Overview() {
  const mobile = useIsMobile();
  const now = useNow(60_000);
  const [range, setRange] = useState<Range>('7d');
  const from = rangeFrom(range, now);
  const summary = useSummary({ from });
  const species = useSpeciesStats({ from });
  const parks = useParkStats({ from });
  const hourly = useHourly({ from });

  const [heroP, setHeroP] = useState(0);
  const [gp, setGp] = useState(0);
  const [seen, setSeen] = useState<Record<number, boolean>>({ 0: true });

  useSectionPeek(SECTIONS);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = SECTIONS.findIndex((s) => s.id === e.target.id);
          if (i > 0) setSeen((s) => (s[i] ? s : { ...s, [i]: true }));
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px 8% 0px' },
    );
    SECTIONS.slice(1).forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    landing.set({ active: true, attached: true });
    let raf = 0;

    const measure = () => {
      raf = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const hero = document.getElementById('wm-top');
      setHeroP(
        Math.round(
          Math.min(1, Math.max(0, y / (hero?.offsetHeight ?? vh))) * 50,
        ) / 50,
      );

      const g = document.getElementById('wm-guide');
      if (g) {
        const r = g.getBoundingClientRect();
        if (r.bottom > -200 && r.top < vh + 200) {
          setGp(
            Math.round(
              Math.max(
                -1.2,
                Math.min(1.2, (vh / 2 - (r.top + r.height / 2)) / vh),
              ) * 60,
            ) / 60,
          );
        }
      }

      const { attached } = landing.get();
      if (attached && y > 40) landing.set({ attached: false });
      else if (!attached && y < 20) landing.set({ attached: true });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const first = setTimeout(() => {
      const target = location.hash
        ? document.getElementById(location.hash.slice(1))
        : null;
      target?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      measure();
    }, 400);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(first);
      landing.set({ active: false });
    };
  }, []);

  const data: OverviewData = {
    range,
    rangeLower: `last ${RANGE_WORDS[range]}`,
    now,
    summary: summary.data,
    species: species.data,
    parks: parks.data,
    hourly: hourly.data,
  };

  const sectionStyle: CSSProperties = {
    maxWidth: 1360,
    margin: '0 auto',
    boxSizing: 'border-box',
    padding: mobile ? '40px 16px' : '60px 40px',
  };
  const secCls = (i: number) => (seen[i] ? 'wm-sec-in' : 'wm-sec-wait');

  return (
    <div>
      <Hero
        data={data}
        heroP={heroP}
        onCycleRange={() =>
          setRange((r) => RANGES[(RANGES.indexOf(r) + 1) % RANGES.length])
        }
        loading={summary.isPending}
      />
      <section
        id="wm-guide"
        aria-label="Field guide"
        className={secCls(1)}
        style={sectionStyle}
      >
        <Guide data={data} gp={gp} />
      </section>
      <section
        id="wm-map"
        aria-label="Where they move"
        className={secCls(2)}
        style={sectionStyle}
      >
        <MapSection data={data} />
      </section>
      <section
        id="wm-rhythm"
        aria-label="Daily rhythm"
        className={secCls(3)}
        style={sectionStyle}
      >
        <Rhythm data={data} />
      </section>
      <Footer />
    </div>
  );
}

export const h2Style = (mobile: boolean): CSSProperties => ({
  margin: 0,
  fontWeight: 500,
  letterSpacing: '-0.03em',
  lineHeight: 0.98,
  color: 'var(--text)',
  fontSize: mobile ? 44 : 68,
});

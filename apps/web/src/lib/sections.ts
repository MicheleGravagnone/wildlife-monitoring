import { useEffect } from 'react';
import { createStore } from './store';

export interface PageSection {
  id: string;
  title: string;
  photo: string;
}

export const sectionStore = createStore({
  sections: [] as PageSection[],
  current: 0,
  peek: false,
});

const PEEK_MS = 1700;

export function useSectionPeek(sections: PageSection[]): void {
  const key = sections.map((s) => s.id).join('|');
  useEffect(() => {
    sectionStore.set({ sections, current: 0, peek: false });
    let raf = 0;
    let peekT: ReturnType<typeof setTimeout> | undefined;

    const measure = () => {
      raf = 0;
      const vh = window.innerHeight;
      let cur = 0;
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < vh * 0.45) cur = i;
      });
      if (cur === sectionStore.get().current) return;
      sectionStore.set({ current: cur, peek: true });
      clearTimeout(peekT);
      peekT = setTimeout(() => sectionStore.set({ peek: false }), PEEK_MS);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const first = setTimeout(measure, 450);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(first);
      clearTimeout(peekT);
      sectionStore.set({ sections: [], current: 0, peek: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

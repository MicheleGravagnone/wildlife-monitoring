import { useEffect, useRef, useState } from 'react';
import { api, API_BASE } from '../../api/client';
import type { Detection, Page } from '../../api/types';

export function useLiveSightings(
  from: number,
  onArrive: (d: Detection) => void,
) {
  const [items, setItems] = useState<Detection[]>([]);
  const [status, setStatus] = useState<
    'loading' | 'stream' | 'polling' | 'error'
  >('loading');
  const arrive = useRef(onArrive);
  arrive.current = onArrive;

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | undefined;
    const seen = new Set<string>();
    let latest = from;

    const add = (ds: Detection[], notify: boolean) => {
      const fresh = ds.filter((d) => !seen.has(d.id));
      if (!fresh.length) return;
      fresh.forEach((d) => {
        seen.add(d.id);
        latest = Math.max(latest, Date.parse(d.capturedAt));
      });
      setItems((prev) =>
        [...prev, ...fresh].sort(
          (a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt),
        ),
      );
      if (notify) fresh.forEach((d) => arrive.current(d));
    };

    const fetchSince = (since: number) =>
      api<Page<Detection>>('/detections', {
        query: {
          from: new Date(since).toISOString(),
          sort: 'oldest',
          pageSize: 500,
        },
      });

    const startPolling = () => {
      if (poll || cancelled) return;
      setStatus('polling');
      poll = setInterval(() => {
        fetchSince(latest + 1)
          .then((p) => add(p.items, true))
          .catch(() => setStatus('error'));
      }, 15_000);
    };

    fetchSince(from)
      .then((p) => {
        if (cancelled) return;
        add(p.items, false);
        if (typeof EventSource === 'undefined') return startPolling();
        source = new EventSource(`${API_BASE}/detections/stream`, {
          withCredentials: true,
        });
        source.addEventListener('open', () => setStatus('stream'));
        source.addEventListener('detection', (e) => {
          try {
            add(
              [JSON.parse((e as MessageEvent<string>).data) as Detection],
              true,
            );
          } catch {}
        });
        source.addEventListener('error', () => {
          if (source?.readyState === EventSource.CLOSED) startPolling();
        });
      })
      .catch(() => !cancelled && setStatus('error'));

    return () => {
      cancelled = true;
      source?.close();
      clearInterval(poll);
    };
  }, [from]);

  return { items, status };
}

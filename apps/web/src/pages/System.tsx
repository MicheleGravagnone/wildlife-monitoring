import type { CSSProperties } from 'react';
import { useDeadLetters, usePipeline } from '../api/hooks';
import type { QueueStatus } from '../api/types';
import { useBubbleProps } from '../components/Bubble';
import { eyebrow, LoadError } from '../components/ui';
import { useIsMobile } from '../lib/hooks';
import { useSectionPeek, type PageSection } from '../lib/sections';
import { fmtDay, fmtTime, HOUR } from '../lib/time';

const panel: CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid rgba(190,227,201,0.12)',
};

const FLOW: [string, boolean][] = [
  ['ESP32 camera traps', false],
  ['POST /captures · 202', false],
  ['captures.raw', true],
  ['Python inference', false],
  ['detections.classified', true],
  ['PostgreSQL 17', false],
];

const QUEUE_NOTE: Record<string, (q: QueueStatus) => string> = {
  'captures.raw': (q) =>
    `${q.consumers} inference worker${q.consumers === 1 ? '' : 's'} · prefetch_count ${q.prefetchCount ?? '—'}`,
  'detections.classified': (q) =>
    `${q.consumers} backend consumer${q.consumers === 1 ? '' : 's'}`,
  'captures.dlq': () => 'via captures.dlx · needs review',
};

function bytes(n: number | null): string {
  if (n == null) return '—';
  const gb = n / 1024 ** 3;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(n / 1024 ** 2).toFixed(0)} MB`;
}

const SECTIONS: PageSection[] = [
  { id: 'wm-sys-top', title: 'Trap to journal', photo: '/assets/pk-jul.jpg' },
  { id: 'wm-sys-queues', title: 'Queues', photo: '/assets/sp-marten.jpg' },
  {
    id: 'wm-sys-rate',
    title: 'Throughput and latency',
    photo: '/assets/sp-hedgehog.jpg',
  },
  { id: 'wm-sys-dlq', title: 'Dead letters', photo: '/assets/sp-badger.jpg' },
];

export function System() {
  useSectionPeek(SECTIONS);
  const mobile = useIsMobile();
  const pipe = usePipeline(true);
  const dlq = useDeadLetters(true);
  const p = pipe.data;
  const max = Math.max(1, ...(p?.hourlyClassified ?? [1]));
  const total = p?.hourlyClassified.reduce((a, b) => a + b, 0) ?? 0;
  const down = p
    ? Object.entries(p.components)
        .filter(([, v]) => v === 'down')
        .map(([k]) => k)
    : [];

  return (
    <div
      style={{
        maxWidth: 1360,
        margin: '0 auto',
        boxSizing: 'border-box',
        padding: mobile ? '100px 14px 120px' : '140px 40px 80px',
      }}
    >
      <div
        id="wm-sys-top"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 720,
          marginBottom: 32,
        }}
      >
        <span style={eyebrow}>STAFF · INGESTION PIPELINE</span>
        <h1
          style={{
            margin: 0,
            fontWeight: 300,
            letterSpacing: '-0.03em',
            lineHeight: 0.95,
            fontSize: mobile ? 52 : 96,
          }}
        >
          trap to{' '}
          <span style={{ fontWeight: 700, color: 'var(--mint)' }}>JOURNAL</span>
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.65,
            color: 'var(--body)',
          }}
        >
          Queue health for the capture → inference → persistence pipeline on
          RabbitMQ. Refreshes every 10 seconds.
        </p>
      </div>

      {pipe.isError && (
        <LoadError what="pipeline status" onRetry={() => void pipe.refetch()} />
      )}
      {down.length > 0 && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: '14px 16px',
            borderRadius: 18,
            background: 'rgba(181,65,47,0.16)',
            border: '1px solid rgba(224,128,106,0.35)',
            color: '#F6C7BC',
            fontSize: 13,
          }}
        >
          Down: {down.join(', ')}.
        </div>
      )}

      <ol
        aria-label="Pipeline stages"
        style={{
          listStyle: 'none',
          margin: '0 0 22px',
          padding: 0,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {FLOW.map(([label, hl], i) => (
          <li
            key={label}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 34,
                padding: '0 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                ...(hl
                  ? { background: 'var(--mint)', color: 'var(--bg)' }
                  : {
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      border: '1px solid rgba(190,227,201,0.18)',
                    }),
              }}
            >
              {label}
            </span>
            {i < FLOW.length - 1 && (
              <span aria-hidden="true" style={{ color: 'var(--muted)' }}>
                →
              </span>
            )}
          </li>
        ))}
      </ol>

      <div
        id="wm-sys-queues"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${mobile ? 220 : 260}px, 1fr))`,
          gap: 14,
          marginBottom: 14,
        }}
      >
        {(p?.queues ?? []).map((q) => {
          const warn = q.name.endsWith('dlq') && q.messagesReady > 0;
          return (
            <div
              key={q.name}
              style={{
                ...panel,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 20,
                borderRadius: 24,
                ...(warn ? { borderColor: 'rgba(224,128,106,0.4)' } : {}),
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  color: warn ? '#F0A898' : 'var(--mint)',
                }}
              >
                {q.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 44, fontWeight: 300, lineHeight: 1 }}>
                  {q.messagesReady}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  messages ready
                </span>
              </span>
              <span style={{ fontSize: 12, color: 'var(--body)' }}>
                {QUEUE_NOTE[q.name]?.(q) ?? `${q.consumers} consumers`}
              </span>
              <span
                style={{
                  display: 'block',
                  height: 5,
                  borderRadius: 99,
                  background: 'rgba(231,240,234,0.08)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: 5,
                    borderRadius: 99,
                    width: `${Math.max(4, Math.min(100, (q.messagesReady / 20) * 100)).toFixed(0)}%`,
                    background: warn ? 'var(--coral)' : 'var(--mint)',
                    transition: 'width .8s var(--ios)',
                  }}
                />
              </span>
            </div>
          );
        })}
        {pipe.isPending &&
          Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="wm-skeleton"
              style={{ height: 150, borderRadius: 24 }}
            />
          ))}
      </div>

      <div
        id="wm-sys-rate"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}
      >
        <div
          style={{
            ...panel,
            flex: '2 1 420px',
            padding: 22,
            borderRadius: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>
              Captures classified per hour
            </h2>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              last 24 h · {total}
            </span>
          </div>
          <div
            role="group"
            aria-label="Captures classified per hour, last 24 hours"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 3,
              height: 140,
            }}
          >
            {(p?.hourlyClassified ?? Array.from({ length: 24 }, () => 0)).map(
              (c, i) => (
                <HourBar
                  key={i}
                  count={c}
                  index={i}
                  max={max}
                  generatedAt={p?.generatedAt}
                />
              ),
            )}
          </div>
        </div>
        <div
          style={{
            flex: '1 1 300px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 14,
          }}
        >
          {[
            [
              'Inference p50',
              p?.inferenceLatency.p50 != null
                ? `${p.inferenceLatency.p50.toFixed(1)} s`
                : '—',
              'capture → classified',
            ],
            [
              'Inference p95',
              p?.inferenceLatency.p95 != null
                ? `${p.inferenceLatency.p95.toFixed(1)} s`
                : '—',
              `${p?.inferenceLatency.samples ?? 0} captures · 24 h`,
            ],
            [
              'Ingest 202 p95',
              p?.ingestLatencyP95Ms != null
                ? `${p.ingestLatencyP95Ms} ms`
                : '—',
              'radio time saved',
            ],
            [
              'Object storage',
              bytes(p?.objectStorageBytes ?? null),
              p?.modelVersion ?? 'model unknown',
            ],
          ].map(([k, v, sub]) => (
            <div
              key={k}
              style={{
                ...panel,
                padding: 18,
                borderRadius: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{k}</span>
              <span style={{ fontSize: 28, fontWeight: 300 }}>{v}</span>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--body)',
                }}
              >
                {sub}
              </span>
            </div>
          ))}
        </div>
      </div>

      <section
        id="wm-sys-dlq"
        style={{ ...panel, padding: 22, borderRadius: 24 }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 500 }}>
          Dead-letter queue ·{' '}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 15 }}>
            captures.dlq
          </span>
        </h2>
        {dlq.isError && (
          <LoadError what="dead letters" onRetry={() => void dlq.refetch()} />
        )}
        {(dlq.data ?? []).map((d) => (
          <div
            key={d.id}
            style={{
              display: 'grid',
              gridTemplateColumns: mobile ? '1fr auto' : '130px 120px 1fr auto',
              gap: mobile ? '4px 12px' : 16,
              alignItems: 'baseline',
              padding: '12px 0',
              borderTop: '1px solid rgba(190,227,201,0.08)',
              fontSize: 13,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 12,
                color: 'var(--muted)',
              }}
            >
              {fmtTime(d.deadLetteredAt)} {fmtDay(d.deadLetteredAt)}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
              {d.deviceId ?? 'unknown device'}
            </span>
            <span
              style={{
                color: 'var(--body)',
                gridColumn: mobile ? '1 / -1' : undefined,
              }}
            >
              {d.reason}
            </span>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              {d.attempts} attempt{d.attempts === 1 ? '' : 's'}
            </span>
          </div>
        ))}
        {dlq.data?.length === 0 && (
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            Empty. Nothing needs review.
          </span>
        )}
      </section>
    </div>
  );
}

function HourBar({
  count,
  index,
  max,
  generatedAt,
}: {
  count: number;
  index: number;
  max: number;
  generatedAt?: string;
}) {
  const end =
    (generatedAt ? Date.parse(generatedAt) : Date.now()) - (23 - index) * HOUR;
  const bubble = useBubbleProps(() => ({
    title: `${count} captures`,
    sub: `${fmtTime(end - HOUR)} – ${fmtTime(end)}`,
  }));
  const current = index === 23;
  return (
    <button
      type="button"
      aria-label={`${fmtTime(end - HOUR)} to ${fmtTime(end)}: ${count} captures`}
      {...bubble}
      style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        padding: 0,
        border: 0,
        background: 'transparent',
        cursor: 'default',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <span
        style={{
          display: 'block',
          width: '100%',
          borderRadius: '4px 4px 1px 1px',
          height: `${Math.max(3, (count / max) * 100).toFixed(1)}%`,
          background: current ? 'var(--coral)' : 'var(--mint)',
          opacity: current ? 1 : 0.75,
          transition: 'height .6s var(--ios)',
        }}
      />
    </button>
  );
}

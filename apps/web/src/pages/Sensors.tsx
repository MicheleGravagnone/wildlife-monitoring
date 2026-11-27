import { useState, type CSSProperties } from 'react';
import {
  useDeployments,
  useDetections,
  useMe,
  useSensorHealth,
  useSensorHealthDetail,
} from '../api/hooks';
import type {
  Detection,
  SensorAlert,
  SensorHealth,
  SensorStatus,
} from '../api/types';
import { CloseButton, Drawer } from '../components/Drawer';
import {
  Chip,
  eyebrow,
  Fields,
  LoadError,
  SENSOR_STATUS,
  SensorPill,
  Sparkline,
} from '../components/ui';
import { useIsMobile, useNow } from '../lib/hooks';
import { useSectionPeek, type PageSection } from '../lib/sections';
import { shortPark } from '../lib/parks';
import { NEUTRAL_COLOR, speciesFor } from '../lib/species';
import { duration, fmtDay, fmtTime } from '../lib/time';
import { labelOf } from './bubbles';

type Filter = SensorStatus | 'all';

export function alertText(
  a: SensorAlert,
  h: SensorHealth,
  now: number,
): string {
  const hb = h.lastHeartbeat;
  const since = duration((now - Date.parse(a.since)) / 1000);
  const where = h.deployment ? ` at ${h.deployment.name}` : '';
  switch (a.code) {
    case 'NO_HEARTBEAT':
      return `No heartbeat for ${since}.${hb ? ` Last report: battery ${hb.batteryPercent} %, pack voltage ${hb.batteryVoltage.toFixed(2)} V.` : ''} Check the battery pack${where}.`;
    case 'LOW_BATTERY':
      return `Battery at ${hb?.batteryPercent ?? '?'} % for ${since}.${hb?.powerSource === 'solar' ? ' Solar input is low (canopy shade, short days).' : ' Swap the battery pack soon.'}`;
    case 'WEAK_SIGNAL':
      return `Weak Wi-Fi signal (${hb?.rssi ?? '?'} dBm) for ${since}. Captures are buffered on the SD card until uploads succeed.`;
    case 'LOW_STORAGE':
      return `SD buffer ${hb?.storageUsedPercent ?? '?'} % full. Uploads may be failing.`;
    case 'UPLOAD_RETRIES':
      return `${hb?.uploadRetries24h ?? 'Several'} uploads retried in the last 24 h.`;
  }
}

const SECTIONS: PageSection[] = [
  { id: 'wm-s-top', title: 'Camera traps', photo: '/assets/pk-art.jpg' },
  {
    id: 'wm-s-grid',
    title: 'Health of each camera',
    photo: '/assets/sp-squirrel.jpg',
  },
];

export function Sensors() {
  useSectionPeek(SECTIONS);
  const mobile = useIsMobile();
  const now = useNow(5000);
  const health = useSensorHealth(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const all = health.data ?? [];
  const n = (s: SensorStatus) => all.filter((x) => x.status === s).length;
  const shown = all.filter((s) => filter === 'all' || s.status === filter);
  const listening = n('online') + n('attention');
  const unknown = n('unknown');

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
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <div
          id="wm-s-top"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 620,
          }}
        >
          <span style={eyebrow}>STAFF · CAMERA TRAPS</span>
          <h1
            style={{
              margin: 0,
              fontWeight: 300,
              letterSpacing: '-0.03em',
              lineHeight: 0.95,
              fontSize: mobile ? 52 : 96,
            }}
          >
            {health.isPending
              ? '…'
              : listening === all.length
                ? `all ${all.length} listening`
                : `${listening} of ${all.length} listening`}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.65,
              color: 'var(--body)',
            }}
          >
            Heartbeat telemetry from each ESP32 camera trap. Read-only: sensors
            and deployments are immutable, so moving a camera creates a new
            deployment.
            {unknown > 0 &&
              ` ${unknown} ${unknown === 1 ? 'camera has' : 'cameras have'} never sent a heartbeat, so ${unknown === 1 ? 'its' : 'their'} health is unknown.`}
          </p>
        </div>
        <div
          role="group"
          aria-label="Filter sensors"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
        >
          {(
            [
              ['all', `All ${all.length}`],
              ['online', `Online ${n('online')}`],
              ['attention', `Attention ${n('attention')}`],
              ['offline', `Offline ${n('offline')}`],
              ...(unknown ? [['unknown', `No telemetry ${unknown}`]] : []),
            ] as [Filter, string][]
          ).map(([v, l]) => (
            <Chip key={v} on={filter === v} onClick={() => setFilter(v)}>
              {l}
            </Chip>
          ))}
        </div>
      </div>

      {health.isError && (
        <LoadError what="sensor health" onRetry={() => void health.refetch()} />
      )}
      <div
        id="wm-s-grid"
        style={{
          display: 'grid',
          scrollMarginTop: 100,
          gridTemplateColumns: `repeat(auto-fill, minmax(${mobile ? 260 : 300}px, 1fr))`,
          gap: 16,
        }}
      >
        {health.isPending
          ? Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="wm-skeleton"
                style={{ height: 230, borderRadius: 24 }}
              />
            ))
          : shown.map((s) => (
              <SensorCard
                key={s.sensor.id}
                s={s}
                now={now}
                onPick={() => setSelected(s.sensor.id)}
              />
            ))}
      </div>

      {selected && (
        <SensorDrawer
          id={selected}
          now={now}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function SensorCard({
  s,
  now,
  onPick,
}: {
  s: SensorHealth;
  now: number;
  onPick: () => void;
}) {
  const hb = s.lastHeartbeat;
  const low = !!hb && hb.batteryPercent < 20;
  const m = SENSOR_STATUS[s.status];
  const metric = (k: string, v: string, warn = false) => (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--muted)' }}
      >
        {k}
      </span>
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 13,
          color: warn ? '#F0A898' : 'var(--text)',
        }}
      >
        {v}
      </span>
    </span>
  );
  const card: CSSProperties = {
    background: 'var(--panel)',
    border: '1px solid rgba(190,227,201,0.12)',
    ...(s.status === 'offline' || s.status === 'attention'
      ? { borderColor: `${m.dot}66` }
      : {}),
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 18,
    borderRadius: 24,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    color: 'var(--text)',
  };
  return (
    <button type="button" className="wm-card" onClick={onPick} style={card}>
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
          width: '100%',
        }}
      >
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 500 }}>
            {s.deployment ? shortPark(s.deployment.parkName) : 'Not deployed'}
          </span>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--muted)',
            }}
          >
            {s.sensor.deviceId}
            {s.deployment ? ` · ${s.deployment.name}` : ''}
          </span>
        </span>
        <SensorPill status={s.status} />
      </span>
      {hb ? (
        <span
          role="meter"
          aria-label="Battery"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={hb.batteryPercent}
          style={{
            display: 'block',
            width: '100%',
            height: 10,
            borderRadius: 99,
            background: 'rgba(231,240,234,0.08)',
            margin: '20px 0',
          }}
        >
          <span
            style={{
              display: 'block',
              height: 10,
              borderRadius: 99,
              width: `${Math.max(3, hb.batteryPercent)}%`,
              background: low ? 'var(--coral)' : 'var(--mint)',
              transition: 'width .8s var(--ios)',
            }}
          />
        </span>
      ) : (
        <span
          style={{
            height: 50,
            display: 'grid',
            placeItems: 'center',
            fontSize: 12,
            color: 'var(--muted)',
            borderRadius: 12,
            border: '1px dashed rgba(190,227,201,0.16)',
          }}
        >
          waiting for the first heartbeat
        </span>
      )}
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {metric('BATTERY', hb ? `${hb.batteryPercent}%` : '—', low)}
        {metric(
          'SIGNAL',
          hb?.rssi != null ? `${hb.rssi} dBm` : '—',
          !!hb?.rssi && hb.rssi < -85,
        )}
        {metric(
          'SEEN',
          hb ? duration((now - Date.parse(hb.receivedAt)) / 1000) : 'never',
        )}
      </span>
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          fontSize: 11,
          color: 'var(--muted)',
        }}
      >
        <span>{s.capturesToday} captures today</span>
        <span>{hb ? `fw ${hb.firmwareVersion}` : ''}</span>
      </span>
    </button>
  );
}

function SensorDrawer({
  id,
  now,
  onClose,
}: {
  id: string;
  now: number;
  onClose: () => void;
}) {
  const { data: me } = useMe();
  const detail = useSensorHealthDetail(id);
  const history = useDeployments(id);
  const recent = useDetections(
    { sensorId: id, pageSize: 5, sort: 'newest' },
    me?.id ?? null,
  );
  const s = detail.data;
  const hb = s?.lastHeartbeat;
  const low = !!hb && hb.batteryPercent < 20;

  return (
    <Drawer label="Sensor details" onClose={onClose}>
      {!s ? (
        detail.isError ? (
          <LoadError what="this sensor" />
        ) : (
          <div
            className="wm-skeleton"
            style={{ height: 200, borderRadius: 22 }}
          />
        )
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            padding: '10px 10px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SensorPill
                status={s.status}
                style={{ alignSelf: 'flex-start' }}
              />
              <h2
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 500,
                  lineHeight: 1.05,
                }}
              >
                {s.deployment?.parkName ?? 'Not deployed'}
              </h2>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                {s.sensor.deviceId}
                {s.deployment ? ` · ${s.deployment.name}` : ''}
              </span>
            </div>
            <CloseButton onClick={onClose} />
          </div>
          {s.alerts.map((a) => (
            <div
              key={a.code}
              role="status"
              style={{
                padding: '14px 16px',
                borderRadius: 18,
                background: 'rgba(181,65,47,0.16)',
                border: '1px solid rgba(224,128,106,0.35)',
                fontSize: 13,
                lineHeight: 1.5,
                color: '#F6C7BC',
              }}
            >
              {alertText(a, s, now)}
            </div>
          ))}
          {s.status === 'unknown' && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 18,
                background: 'rgba(231,240,234,0.06)',
                border: '1px solid var(--hairline)',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--body)',
              }}
            >
              This camera has never reported telemetry. Captures still arrive,
              but battery, signal and uptime are unknown until its firmware
              sends heartbeats.
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 16,
              borderRadius: 22,
              background: 'var(--bg)',
            }}
          >
            <span
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--muted)',
              }}
            >
              <span>Battery · last 24 h</span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                {hb ? `${hb.batteryPercent} %` : '—'}
              </span>
            </span>
            <Sparkline
              values={s.batterySeries}
              height={70}
              low={low}
              stroke={2.2}
            />
          </div>
          <Fields
            fields={[
              { k: 'Signal', v: hb?.rssi != null ? `${hb.rssi} dBm` : '—' },
              {
                k: 'Last heartbeat',
                v: hb
                  ? `${duration((now - Date.parse(hb.receivedAt)) / 1000)} ago`
                  : 'never',
              },
              {
                k: 'Power',
                v: hb
                  ? hb.powerSource === 'solar'
                    ? 'Solar + Li-ion'
                    : 'Battery pack'
                  : '—',
              },
              { k: 'Firmware', v: hb?.firmwareVersion ?? '—' },
              {
                k: 'Enclosure temp',
                v: hb?.temperatureC != null ? `${hb.temperatureC} °C` : '—',
              },
              {
                k: 'SD used',
                v:
                  hb?.storageUsedPercent != null
                    ? `${hb.storageUsedPercent} %`
                    : '—',
              },
              {
                k: 'Uptime',
                v:
                  hb && hb.uptimeSeconds
                    ? `${Math.round(hb.uptimeSeconds / 86400)} days`
                    : '—',
              },
              { k: 'Captures today', v: String(s.capturesToday) },
              {
                k: 'Location',
                v: s.deployment
                  ? `${s.deployment.latitude.toFixed(4)}, ${s.deployment.longitude.toFixed(4)}`
                  : '—',
              },
              { k: 'Sensor ID', v: s.sensor.id },
            ]}
          />
          <section style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 500 }}>
              Deployment history
            </h3>
            {(history.data ?? []).map((dep, i) => (
              <div
                key={dep.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontSize: 12,
                  padding: '8px 0',
                  borderTop: '1px solid rgba(190,227,201,0.08)',
                }}
              >
                <span>
                  {dep.name} · {dep.parkName}
                  {i === 0 ? ' (current)' : ''}
                </span>
                <span
                  style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}
                >
                  since {fmtDay(dep.installedAt)}
                </span>
              </div>
            ))}
          </section>
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              paddingBottom: 8,
            }}
          >
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 500 }}>
              Recent captures
            </h3>
            {((recent.data?.items ?? []) as Detection[]).map((x) => (
              <div
                key={x.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  padding: '7px 0',
                  borderTop: '1px solid rgba(190,227,201,0.08)',
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    flex: 'none',
                    background:
                      speciesFor(x.speciesLabel)?.color ?? NEUTRAL_COLOR,
                  }}
                />
                <span style={{ flex: 1 }}>
                  {labelOf(x)}
                  {x.confidence != null ? ` · ${x.confidence.toFixed(2)}` : ''}
                </span>
                <span
                  style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}
                >
                  {fmtDay(x.capturedAt)} {fmtTime(x.capturedAt)}
                </span>
              </div>
            ))}
            {recent.data && recent.data.total === 0 && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                No captures yet.
              </span>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

import { Map as MapLibre, Marker, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { Detection } from '../../api/types';
import { useBubble } from '../../components/Bubble';
import { Loader } from '../../components/Loader';
import { speciesFor } from '../../lib/species';
import { ago } from '../../lib/time';
import { detectionBubble, labelOf } from '../bubbles';
import { HOME_VIEW, mapStyle } from './mapStyle';

setWorkerUrl(workerUrl);

export interface LiveMapHandle {
  orbit: (deg: number) => void;
  tilt: (deg: number) => void;
  zoom: (delta: number) => void;
  reset: () => void;
}

export interface Pin {
  d: Detection;
  age: number;
  fresh: boolean;
  showLabel: boolean;
}

function jitter(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return [
    ((h & 0xff) / 255 - 0.5) * 0.0012,
    (((h >> 8) & 0xff) / 255 - 0.5) * 0.0008,
  ];
}
const pos = (d: Detection): [number, number] => {
  const [dx, dy] = jitter(d.id);
  return [d.longitude + dx, d.latitude + dy];
};

export const LiveMap = forwardRef<
  LiveMapHandle,
  {
    pins: Pin[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    viewT: number;
    replay: boolean;
    mobile: boolean;
  }
>(function LiveMap({ pins, selectedId, onSelect, viewT, replay, mobile }, ref) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibre | null>(null);
  const markers = useRef(
    new Map<
      string,
      {
        marker: Marker;
        el: HTMLDivElement;
        ground: Marker;
        groundEl: HTMLDivElement;
      }
    >(),
  );
  const [ready, setReady] = useState(false);
  const [, force] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { show, hide } = useBubble();
  const home = mobile ? HOME_VIEW.mobile : HOME_VIEW.desktop;

  useEffect(() => {
    if (!container.current) return;
    let m: MapLibre;
    try {
      m = new MapLibre({
        container: container.current,
        style: mapStyle,
        ...home,
        maxPitch: 75,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true);
      return;
    }
    map.current = m;
    m.once('style.load', () => setReady(true));
    m.once('load', () => setLoaded(true));
    const giveUp = setTimeout(() => setLoaded(true), 10_000);
    return () => {
      clearTimeout(giveUp);
      markers.current.forEach(({ marker, ground }) => {
        marker.remove();
        ground.remove();
      });
      markers.current.clear();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    orbit: (deg) =>
      map.current?.easeTo({
        bearing: map.current.getBearing() + deg,
        duration: 900,
      }),
    tilt: (deg) =>
      map.current?.easeTo({
        pitch: Math.max(0, Math.min(75, map.current.getPitch() + deg)),
        duration: 700,
      }),
    zoom: (delta) =>
      map.current?.easeTo({
        zoom: map.current.getZoom() + delta,
        duration: 500,
      }),
    reset: () => map.current?.flyTo({ ...home, duration: 1600 }),
  }));

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const want = new Set(pins.map((p) => p.d.id));
    for (const [id, { marker, ground }] of markers.current) {
      if (!want.has(id)) {
        marker.remove();
        ground.remove();
        markers.current.delete(id);
      }
    }
    let added = false;
    for (const p of pins) {
      if (markers.current.has(p.d.id)) continue;
      const groundEl = document.createElement('div');
      const ground = new Marker({
        element: groundEl,
        anchor: 'center',
        pitchAlignment: 'map',
        rotationAlignment: 'map',
      })
        .setLngLat(pos(p.d))
        .addTo(m);
      const el = document.createElement('div');
      const marker = new Marker({
        element: el,
        anchor: 'bottom',
        pitchAlignment: 'viewport',
        rotationAlignment: 'viewport',
      })
        .setLngLat(pos(p.d))
        .addTo(m);
      markers.current.set(p.d.id, { marker, el, ground, groundEl });
      added = true;
    }
    if (added) force((n) => n + 1);
  }, [pins, ready]);

  useEffect(() => {
    const p = pins.find((x) => x.d.id === selectedId);
    if (!p || !map.current) return;
    const [lon, lat] = pos(p.d);
    map.current.flyTo({
      center: [lon, lat],
      zoom: 15.2,
      pitch: 62,
      duration: 1800,
      offset: mobile ? [0, -120] : [-120, 40],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (failed) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--muted)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        The 3D map needs WebGL, which this browser has turned off. The feed and
        replay still work.
      </div>
    );
  }

  return (
    <>
      <div
        ref={container}
        style={{ position: 'absolute', inset: 0 }}
        aria-label="3D map of Łódź with live sightings"
        role="region"
      />
      <Loader overlay visible={!loaded} label="Loading the live canopy" />
      {pins.map((p) => {
        const entry = markers.current.get(p.d.id);
        if (!entry) return null;
        const selG = p.d.id === selectedId;
        const spG = speciesFor(p.d.speciesLabel);
        const ringG = p.fresh ? '#E0806A' : spG ? '#BEE3C9' : '#8DA597';
        const peak = p.fresh ? 0.55 : selG ? 0.5 : 0.3;
        const period =
          selG || p.fresh ? 2.4 : 3 + (p.d.id.charCodeAt(0) % 5) * 0.6;
        return createPortal(
          <GroundPulse
            color={ringG}
            peak={peak}
            period={period}
            fade={0.5 + (1 - p.age) * 0.5}
          />,
          entry.groundEl,
          `${p.d.id}-ground`,
        );
      })}
      {pins.map((p) => {
        const entry = markers.current.get(p.d.id);
        if (!entry) return null;
        const sel = p.d.id === selectedId;
        const sp = speciesFor(p.d.speciesLabel);
        const ring = p.fresh ? '#E0806A' : sp ? '#BEE3C9' : '#8DA597';
        return createPortal(
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: 0.5 + (1 - p.age) * 0.5,
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(p.d.id)}
              onPointerEnter={
                mobile
                  ? undefined
                  : (e) => show(e.currentTarget, detectionBubble(p.d, true))
              }
              onPointerLeave={hide}
              aria-label={`${labelOf(p.d)}, ${p.d.parkName}, ${ago(viewT, p.d.capturedAt, replay ? ' earlier' : ' ago')}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                padding: p.showLabel || sel ? '4px 12px 4px 4px' : 4,
                borderRadius: 999,
                color: 'var(--text)',
                cursor: 'pointer',
                background: 'rgba(11,23,17,0.92)',
                border: `1.5px solid ${sel ? '#F2F1EC' : 'rgba(190,227,201,0.3)'}`,
                boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
                transform: `scale(${(mobile ? 1.1 : 1) * (sel ? 1.15 : 1)})`,
                transition: 'transform .3s var(--ios)',
              }}
            >
              {sp ? (
                <img
                  src={sp.photo}
                  alt=""
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flex: 'none',
                  }}
                />
              ) : (
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: '#1A3024',
                    flex: 'none',
                  }}
                />
              )}
              {(p.showLabel || sel) && (
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {labelOf(p.d)}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--muted)',
                    }}
                  >
                    {ago(viewT, p.d.capturedAt, replay ? ' earlier' : ' ago')}
                  </span>
                </span>
              )}
            </button>
            <span
              style={{
                width: 3,
                height: Math.round(40 + (1 - p.age) * 100 + (sel ? 30 : 0)),
                background: `linear-gradient(to bottom, ${ring}, ${ring}30)`,
                transition: 'height .6s var(--ios)',
              }}
            />
          </div>,
          entry.el,
          p.d.id,
        );
      })}
    </>
  );
});

function GroundPulse({
  color,
  peak,
  period,
  fade,
}: {
  color: string;
  peak: number;
  period: number;
  fade: number;
}) {
  const ring = (delay: number) => (
    <span
      className="wm-ground-pulse"
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background: `radial-gradient(circle, ${color}00 45%, ${color}26 100%)`,
        boxSizing: 'border-box',
        animationDuration: `${period}s`,
        animationDelay: `${delay}s`,
        ['--wm-peak' as string]: peak,
      }}
    />
  );
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: 72,
        height: 72,
        opacity: fade,
        pointerEvents: 'none',
      }}
    >
      {ring(0)}
      {ring(-period / 2)}
      <span
        style={{
          position: 'absolute',
          left: 31,
          top: 31,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          opacity: 0.75,
        }}
      />
    </div>
  );
}

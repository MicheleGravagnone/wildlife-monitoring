import {
  Map as MapLibre,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ParkStats } from '../../api/types';
import { useBubbleProps, type BubbleContent } from '../../components/Bubble';
import { Loader } from '../../components/Loader';
import { PARKS } from '../../lib/parks';
import { mapStyle } from '../live/mapStyle';

setWorkerUrl(workerUrl);

const SOURCE = 'park-heat';

function heatData(parks: ParkStats[] | undefined) {
  const max = Math.max(1, ...(parks ?? []).map((p) => p.sightings));
  return {
    type: 'FeatureCollection' as const,
    features: PARKS.map((p) => ({
      type: 'Feature' as const,
      properties: {
        w: (parks?.find((s) => s.parkName === p.name)?.sightings ?? 0) / max,
      },
      geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
    })),
  };
}

export default function HeatMap({
  parks,
  bubble,
  onPick,
  fallback,
}: {
  parks: ParkStats[] | undefined;
  bubble: (name: string) => BubbleContent;
  onPick: (name: string) => void;
  fallback: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibre | null>(null);
  const [markers, setMarkers] = useState<{ name: string; el: HTMLElement }[]>(
    [],
  );
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef(parks);
  latest.current = parks;

  useEffect(() => {
    if (!container.current) return;
    let m: MapLibre;
    try {
      m = new MapLibre({
        container: container.current,
        style: mapStyle,
        bounds: [
          [19.385, 51.745],
          [19.53, 51.845],
        ],
        fitBoundsOptions: { padding: 30 },
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true);
      return;
    }
    map.current = m;
    m.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    const created: Marker[] = [];
    m.once('load', () => setLoaded(true));
    const giveUp = setTimeout(() => setLoaded(true), 10_000);
    m.once('style.load', () => {
      m.addSource(SOURCE, { type: 'geojson', data: heatData(latest.current) });
      m.addLayer(
        {
          id: SOURCE,
          type: 'heatmap',
          source: SOURCE,
          paint: {
            'heatmap-weight': ['get', 'w'],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              9,
              1.6,
              14,
              3,
            ],
            'heatmap-radius': [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              9,
              40,
              11,
              105,
              14,
              600,
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(120,190,150,0)',
              0.15,
              'rgba(120,190,150,0.25)',
              0.4,
              'rgba(190,227,201,0.55)',
              0.7,
              'rgba(226,244,231,0.8)',
              1,
              'rgba(242,241,236,0.95)',
            ],
            'heatmap-opacity': 0.9,
          },
        },
        'wood-outline',
      );
      const els = PARKS.map((p) => {
        const el = document.createElement('div');
        created.push(
          new Marker({ element: el }).setLngLat([p.lon, p.lat]).addTo(m),
        );
        return { name: p.name, el };
      });
      setMarkers(els);
    });
    return () => {
      clearTimeout(giveUp);
      created.forEach((mk) => mk.remove());
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const src = map.current?.getSource(SOURCE) as
      { setData?: (d: unknown) => void } | undefined;
    src?.setData?.(heatData(parks));
  }, [parks]);

  if (failed) return <>{fallback}</>;

  const max = Math.max(1, ...(parks ?? []).map((p) => p.sightings));
  return (
    <>
      <div
        ref={container}
        role="region"
        aria-label="Map of Łódź showing where animals were sighted"
        style={{ position: 'absolute', inset: 0 }}
      />
      <Loader overlay visible={!loaded} size={64} label="Loading the map" />
      {markers.map(({ name, el }) => {
        const n = parks?.find((p) => p.parkName === name)?.sightings ?? 0;
        return createPortal(
          <ParkHotspot
            name={name}
            sightings={n}
            size={14 + Math.sqrt(n / max) * 16}
            bubble={() => bubble(name)}
            onPick={() => onPick(name)}
          />,
          el,
          name,
        );
      })}
    </>
  );
}

function ParkHotspot(p: {
  name: string;
  sightings: number;
  size: number;
  bubble: () => BubbleContent;
  onPick: () => void;
}) {
  const bubble = useBubbleProps(p.bubble);
  return (
    <button
      type="button"
      className="wm-hot wm-hot-marker"
      onClick={p.onPick}
      {...bubble}
      aria-label={`${p.name}: ${p.sightings} sightings. Open in the journal`}
      style={{
        position: 'relative',
        display: 'block',
        width: p.size,
        height: p.size,
        borderRadius: '50%',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        transition: 'width .6s var(--ios), height .6s var(--ios)',
        background:
          'radial-gradient(circle, #F2F1EC 0 24%, rgba(190,227,201,0.6) 36%, rgba(190,227,201,0) 70%)',
      }}
    />
  );
}

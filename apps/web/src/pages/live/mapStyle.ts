import type { StyleSpecification } from 'maplibre-gl';

export const mapStyle: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    omt: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution:
        '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0B1711' },
    },
    {
      id: 'landuse',
      type: 'fill',
      source: 'omt',
      'source-layer': 'landuse',
      paint: { 'fill-color': '#0F1F17' },
    },
    {
      id: 'landcover-grass',
      type: 'fill',
      source: 'omt',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['grass', 'farmland']]],
      paint: { 'fill-color': '#13281D', 'fill-opacity': 0.8 },
    },
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'omt',
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'wood'],
      paint: { 'fill-color': '#1A3A29' },
    },
    {
      id: 'park',
      type: 'fill',
      source: 'omt',
      'source-layer': 'park',
      paint: { 'fill-color': '#1E4030', 'fill-outline-color': '#2F5A44' },
    },
    {
      id: 'city-parks',
      type: 'fill',
      source: 'omt',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'subclass'], ['literal', ['park', 'garden']]],
      paint: { 'fill-color': '#1E4030', 'fill-opacity': 0.75 },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'omt',
      'source-layer': 'water',
      paint: { 'fill-color': '#2C5550' },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'omt',
      'source-layer': 'waterway',
      paint: {
        'line-color': '#4E7F86',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 16, 3],
      },
    },
    {
      id: 'roads-minor',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: [
        'in',
        ['get', 'class'],
        ['literal', ['minor', 'service', 'tertiary', 'secondary']],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#1F3528',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.4, 16, 4],
      },
    },
    {
      id: 'roads-major',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: [
        'in',
        ['get', 'class'],
        ['literal', ['motorway', 'trunk', 'primary']],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#5A3B30',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 7],
      },
    },
    {
      id: 'rail',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'rail'],
      paint: {
        'line-color': '#24392D',
        'line-width': 1,
        'line-dasharray': [3, 3],
      },
    },
    {
      id: 'wood-outline',
      type: 'line',
      source: 'omt',
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'wood'],
      paint: {
        'line-color': 'rgba(190,227,201,0.22)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 15, 1.4],
      },
    },
    {
      id: 'protected-outline',
      type: 'line',
      source: 'omt',
      'source-layer': 'park',
      paint: {
        'line-color': 'rgba(190,227,201,0.4)',
        'line-width': 1,
        'line-dasharray': [3, 2],
      },
    },
    {
      id: 'park-outline',
      type: 'line',
      source: 'omt',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'subclass'], ['literal', ['park', 'garden']]],
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': 'rgba(190,227,201,0.85)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 2.6],
      },
    },
    {
      id: 'buildings-3d',
      type: 'fill-extrusion',
      source: 'omt',
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'render_height'], 8],
          0,
          '#A9A69C',
          30,
          '#D9D6CC',
          80,
          '#F2F1EC',
        ],
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          0,
          14,
          0.82,
        ],
      },
    },
    {
      id: 'place-labels',
      type: 'symbol',
      source: 'omt',
      'source-layer': 'place',
      filter: [
        'in',
        ['get', 'class'],
        ['literal', ['city', 'suburb', 'quarter']],
      ],
      layout: {
        'text-field': [
          'upcase',
          ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        ],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 15, 13],
        'text-letter-spacing': 0.3,
      },
      paint: {
        'text-color': 'rgba(231,240,234,0.42)',
        'text-halo-color': 'rgba(11,23,17,0.8)',
        'text-halo-width': 1.2,
      },
    },
    {
      id: 'park-labels',
      type: 'symbol',
      source: 'omt',
      'source-layer': 'poi',
      filter: ['==', ['get', 'class'], 'park'],
      minzoom: 12,
      layout: {
        'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 13],
        'text-max-width': 8,
      },
      paint: {
        'text-color': 'rgba(190,227,201,0.8)',
        'text-halo-color': 'rgba(11,23,17,0.85)',
        'text-halo-width': 1.2,
      },
    },
  ],
};

export const HOME_VIEW = {
  desktop: {
    center: [19.462, 51.788] as [number, number],
    zoom: 11.4,
    pitch: 56,
    bearing: -22,
  },
  mobile: {
    center: [19.462, 51.79] as [number, number],
    zoom: 10.6,
    pitch: 50,
    bearing: -12,
  },
};

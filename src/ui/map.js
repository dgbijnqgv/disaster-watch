// The Leaflet map: event markers, storm tracks, the user's position and watch area, and the legend.
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LEVELS, headline, where } from '../core/index.js';
import { icon } from '../icons.js';
import { $, esc } from './dom.js';
import { passesFilters, state } from './state.js';

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const MARKER_SIZE = [0, 22, 26, 32, 38]; // px, by threat level
const DOT_SIZE = 12; // minor earthquakes are too many for full markers

/** @type {L.Map} */ let map;
/** @type {L.LayerGroup} */ let trackLayer;
/** @type {L.LayerGroup} */ let eventLayer;
/** @type {L.LayerGroup} */ let homeLayer;
/** @type {Map<string, L.Marker>} */
const markers = new Map();
let onSelect = () => {};

const tipOptions = (offsetY) => ({ className: 'map-tip', direction: 'top', offset: [0, offsetY], opacity: 1 });

function markerTip(e) {
  const distance = state.loc && where(e) ? ` · ${esc(where(e))}` : '';
  return `<strong>${esc(headline(e))}</strong>`
    + `<span><i class="dot" style="--c:${LEVELS[e.level].color}"></i>${esc(LEVELS[e.level].name)} threat${distance}</span>`;
}

const markerEl = (id) => markers.get(id)?.getElement()?.firstElementChild;

/** @param {{ onSelect: (e: object) => void }} handlers */
export function initMap(handlers) {
  onSelect = handlers.onSelect;
  map = L.map('map', { worldCopyJump: true, zoomControl: false, minZoom: 2 }).setView([20, 0], 2);
  trackLayer = L.layerGroup().addTo(map);
  eventLayer = L.layerGroup().addTo(map);
  homeLayer = L.layerGroup().addTo(map);
  L.tileLayer(TILES, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  // Zoom buttons use the app's tooltips instead of the browser's.
  const zoom = L.control.zoom({ position: 'topleft' }).addTo(map);
  for (const a of zoom.getContainer().querySelectorAll('a[title]')) {
    a.dataset.tip = a.title;
    a.removeAttribute('title');
  }

  const levels = LEVELS.slice(1)
    .map((l) => `<div data-tip="${esc(l.blurb)}"><span class="swatch" style="--c:${l.color}"></span>${l.name}</div>`)
    .join('');
  const watchArea = '<div class="muted" data-tip="Events inside this circle are listed under Near me. Change its size in Settings.">'
    + '<span class="swatch ring"></span>Your watch area</div>';
  $('#legend').innerHTML = levels + watchArea;
}

export function renderEvents() {
  eventLayer.clearLayers();
  trackLayer.clearLayers();
  markers.clear();
  // Lowest levels first so serious events are drawn on top.
  for (const e of state.events.filter(passesFilters).sort((a, b) => a.level - b.level)) {
    const color = LEVELS[e.level].color;
    if (e.track?.length > 1) L.polyline(e.track, { color, weight: 3, opacity: 0.8, dashArray: '6 6' }).addTo(trackLayer);
    const dot = e.level === 1 && e.type === 'earthquake';
    const size = dot ? DOT_SIZE : MARKER_SIZE[e.level];
    const classes = ['mk', dot && 'dot', e.inZone && 'inzone', e.id === state.selectedId && 'selected'].filter(Boolean).join(' ');
    const html = `<div class="${classes}" style="--s:${size}px;--c:${color}">${dot ? '' : icon(e.type, Math.round(size * 0.58))}</div>`;
    const marker = L.marker([e.lat, e.lon], { icon: L.divIcon({ className: '', html, iconSize: [size, size] }), zIndexOffset: e.level * 100, keyboard: false })
      .bindTooltip(markerTip(e), tipOptions(-size / 2 - 4))
      .on('click', () => onSelect(e));
    marker.addTo(eventLayer);
    markers.set(e.id, marker);
  }
}

/** The user's position and the watch-area circle around it. */
export function renderHome() {
  homeLayer.clearLayers();
  const { loc } = state;
  if (!loc) return;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  L.circle([loc.lat, loc.lon], { radius: state.settings.radiusKm * 1000, color: accent, weight: 1.5, fillOpacity: 0.05, dashArray: '4 6', interactive: false })
    .addTo(homeLayer);
  L.marker([loc.lat, loc.lon], { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18] }), zIndexOffset: 5000 })
    .bindTooltip(`<strong>You are here</strong><span>${esc(loc.name)}</span>`, tipOptions(-12))
    .addTo(homeLayer);
}

/** Marks one event's marker as selected (or none), and flies to it. */
export function showSelected(e) {
  for (const el of document.querySelectorAll('.mk.selected')) el.classList.remove('selected');
  if (!e) return;
  markerEl(e.id)?.classList.add('selected');
  if (!e.local) map.flyTo([e.lat, e.lon], Math.max(map.getZoom(), e.type === 'storm' ? 5 : 7), { duration: 0.8 });
}

/** Temporarily emphasises a marker, e.g. while its list row is hovered. */
export function highlight(id, on) {
  markerEl(id)?.classList.toggle('hot', on);
}

export function flyTo(lat, lon, zoom) {
  map.flyTo([lat, lon], zoom, { duration: 0.8 });
}

export function setView(lat, lon, zoom) {
  map.setView([lat, lon], zoom);
}

/** Lets the user click a point on the map. Resolves with it, or null if cancelled. */
export function pickPoint() {
  return new Promise((resolve) => {
    const hint = $('#pickHint');
    const finish = (point) => {
      map.off('click', onClick);
      $('#pickCancel').removeEventListener('click', onCancel);
      hint.hidden = true;
      map.getContainer().style.cursor = '';
      resolve(point);
    };
    const onClick = (ev) => finish({ lat: ev.latlng.lat, lon: ((ev.latlng.lng + 540) % 360) - 180 }); // wrap to ±180
    const onCancel = () => finish(null);
    map.on('click', onClick);
    $('#pickCancel').addEventListener('click', onCancel);
    hint.hidden = false;
    map.getContainer().style.cursor = 'crosshair';
  });
}

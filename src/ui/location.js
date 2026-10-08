// Finding the user: GPS / system location first, then an approximate IP-based location,
// or a place the user searches for or picks on the map.
import { distanceKm } from '../core/index.js';
import * as platform from '../platform.js';
import { $ } from './dom.js';
import { flyTo, pickPoint } from './map.js';
import { saveLocation, state } from './state.js';

const MOVED_KM = 5; // ignore GPS jitter when checking a saved location on start-up
let onChange = () => {};

export function renderLocation() {
  $('#locName').textContent = state.loc ? state.loc.name : 'Set location';
  $('#locHint').textContent = state.loc?.source === 'ip' ? 'Approximate' : '';
}

/** "City, ST" for a coordinate, or null. */
async function placeName(lat, lon) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const j = await res.json();
    const region = j.principalSubdivisionCode?.split('-')[1] || j.countryName;
    return [j.city || j.locality, region].filter(Boolean).join(', ') || null;
  } catch { return null; }
}

async function setLocation(lat, lon, source, name) {
  state.loc = { lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)), source, name: name || `${lat.toFixed(2)}, ${lon.toFixed(2)}` };
  saveLocation();
  renderLocation();
  flyTo(state.loc.lat, state.loc.lon, 6);
  onChange();
  if (name) return;
  const found = await placeName(lat, lon);
  if (found && state.loc?.lat === Number(lat.toFixed(4))) {
    state.loc.name = found;
    saveLocation();
    renderLocation();
  }
}

/** Uses the device location. With `onlyIfMoved`, a saved location is kept unless the user has travelled. */
export async function locateByGps({ onlyIfMoved = false } = {}) {
  try {
    const { lat, lon } = await platform.getPosition();
    const { loc } = state;
    if (!(onlyIfMoved && loc && distanceKm(loc.lat, loc.lon, lat, lon) < MOVED_KM)) await setLocation(lat, lon, 'gps');
    return true;
  } catch {
    return false;
  }
}

async function locateByIp() {
  try {
    const j = await (await fetch('https://get.geojs.io/v1/ip/geo.json')).json();
    const name = [j.city, j.region || j.country].filter(Boolean).join(', ');
    await setLocation(Number(j.latitude), Number(j.longitude), 'ip', name || null);
    return true;
  } catch { return false; }
}

/** First run: find the user automatically. Returns false if no method worked. */
export async function autoLocate() {
  return (await locateByGps()) || (await locateByIp());
}

async function search(query) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
    const [hit] = await res.json();
    if (!hit) return alert('Place not found.');
    await setLocation(Number(hit.lat), Number(hit.lon), 'manual', hit.display_name.split(',').slice(0, 2).join(',').trim());
  } catch {
    alert('Search is unavailable right now.');
  }
}

/** @param {{ onChange: () => void }} handlers called whenever the location changes */
export function initLocation(handlers) {
  onChange = handlers.onChange;
  renderLocation();

  $('#gpsBtn').addEventListener('click', async () => {
    if (!(await locateByGps())) {
      alert('Could not get your location. Check that location access is allowed for Disaster Watch, or search or pick on the map instead.');
    }
  });
  $('#pickBtn').addEventListener('click', async () => {
    const point = await pickPoint();
    if (point) setLocation(point.lat, point.lon, 'manual');
  });
  $('#searchForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const query = $('#searchInput').value.trim();
    if (query) search(query);
  });
}

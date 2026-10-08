// The "Where this information comes from" window: every outside service the app uses, what it
// provides, and, for the live disaster feeds, whether it answered on the last refresh.
import { inUS, plural } from '../core/index.js';
import { icon } from '../icons.js';
import { $, $$, esc } from './dom.js';
import { state } from './state.js';
import { hideTip } from './tooltip.js';

/** The live disaster feeds, keyed like `state.sources` and event ids (`usgs:…`). */
const FEEDS = [
  { key: 'usgs', name: 'USGS Earthquake Hazards Program', org: 'U.S. Geological Survey', url: 'https://earthquake.usgs.gov/earthquakes/feed/', provides: 'Earthquakes of magnitude 2.5 and above worldwide, from the past week.' },
  { key: 'gdacs', name: 'GDACS', org: 'United Nations and European Commission', url: 'https://www.gdacs.org/', provides: 'Alerts for tropical cyclones, floods, volcanoes, droughts and wildfires worldwide.' },
  { key: 'eonet', name: 'EONET', org: 'NASA', url: 'https://eonet.gsfc.nasa.gov/', provides: 'Wildfires, storms, volcanoes and other natural events tracked from space.' },
  { key: 'nws', name: 'National Weather Service', org: 'U.S. NOAA', url: 'https://www.weather.gov/', provides: 'Official warnings and watches for your exact location.', usOnly: true },
];

const OTHERS = [
  {
    title: 'Pictures',
    items: [
      { name: 'Worldview satellite imagery', org: 'NASA', url: 'https://worldview.earthdata.nasa.gov/', provides: 'Satellite views of fires, storms, floods and volcanoes, with active fires marked.' },
      { name: 'ShakeMap', org: 'U.S. Geological Survey', url: 'https://earthquake.usgs.gov/data/shakemap/', provides: 'Maps of how strongly significant earthquakes were felt.' },
    ],
  },
  {
    title: 'Map and your location',
    items: [
      { name: 'OpenStreetMap', org: 'OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright', provides: 'The map, and the place search in Settings.' },
      { name: 'BigDataCloud', org: 'BigDataCloud', url: 'https://www.bigdatacloud.com/', provides: 'The name of the place you are in.' },
      { name: 'GeoJS', org: 'GeoJS', url: 'https://www.geojs.io/', provides: 'Your approximate location when your device cannot provide one.' },
    ],
  },
  {
    title: 'Safety advice',
    items: [
      { name: 'Ready.gov', org: 'U.S. FEMA', url: 'https://www.ready.gov/', provides: 'Public preparedness advice that the safety tips and go-bag list are adapted from.' },
      { name: 'American Red Cross', org: 'American Red Cross', url: 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html', provides: 'Public preparedness advice that the safety tips and go-bag list are adapted from.' },
    ],
  },
];

/** Which feed an event came from, from its id (`usgs:…`). */
export const feedKey = (e) => e.id.split(':')[0];

function feedStatus(f) {
  if (f.usOnly && !(state.loc && inUS(state.loc))) return ['off', 'Used only for locations in the United States'];
  const s = state.sources[f.key];
  if (!s) return ['pending', 'Checking…'];
  return s.ok ? ['ok', `Working · ${plural(s.count, 'event', 'events')}`] : ['down', 'Not responding right now'];
}

const link = (item) => `<a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.name)} ${icon('external', 13)}</a>`;

function entry(item, status) {
  return `<li class="source${status ? '' : ' plain'}" data-key="${esc(item.key ?? '')}">
    <div class="source-head">${link(item)}<span class="org">${esc(item.org)}</span></div>
    <p>${esc(item.provides)}</p>
    ${status ? `<p class="source-status"><span class="status-dot ${status[0]}"></span>${esc(status[1])}</p>` : ''}
  </li>`;
}

function render() {
  const checked = state.fetchedAt
    ? `Last checked at ${new Date(state.fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.` : '';
  $('#sourcesBody').innerHTML = `
    <h3>Disaster events</h3>
    <p class="muted small">Every event on the map comes live from one of these. ${checked}</p>
    <ul class="source-list">${FEEDS.map((f) => entry(f, feedStatus(f))).join('')}</ul>
    ${OTHERS.map((g) => `<h3>${g.title}</h3><ul class="source-list">${g.items.map((i) => entry(i)).join('')}</ul>`).join('')}
    <p class="note">The threat levels and the distance to you are worked out by Disaster Watch from each source’s
    own data (magnitude, wind speed, fire size and official alert levels). Disaster Watch is not an official warning
    service: in an emergency, follow your local authorities.</p>`;
}

/** Re-renders the window if it is open, so the feed status stays current after a refresh. */
export function renderSources() {
  if ($('#sourcesDialog').open) render();
}

/** Opens the window, optionally scrolled to and highlighting one feed. */
export function openSources(key) {
  hideTip();
  render();
  const dialog = $('#sourcesDialog');
  dialog.showModal();
  const item = key && $(`.source[data-key="${key}"]`, dialog);
  if (item) {
    item.classList.add('flash');
    item.scrollIntoView({ block: 'center' });
  } else {
    $('#sourcesBody').scrollTop = 0;
  }
}

export function initSources() {
  const dialog = $('#sourcesDialog');
  $('.close', dialog).addEventListener('click', () => dialog.close());
  // A click on the dimmed backdrop lands on the dialog element itself.
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
  document.addEventListener('click', (ev) => {
    const opener = ev.target.closest?.('[data-open-sources]');
    if (opener) openSources(opener.dataset.openSources);
  });
  dialog.addEventListener('close', () => { for (const el of $$('.source.flash', dialog)) el.classList.remove('flash'); });
}

// Entry point of the UI: wires the views together and owns the refresh cycle.
//
//   core/          platform-independent data, wording and alert logic (shared with the background processes)
//   ui/state.js    UI state and persistence        ui/map.js       Leaflet map
//   ui/brief.js    status card                     ui/lists.js     Near me / World lists and filters
//   ui/detail.js   event detail view               ui/prepare.js   Prepare tab
//   ui/settings.js Settings tab                    ui/location.js  finding the user
//   ui/sources.js  "where this comes from" window  ui/tooltip.js   hover tooltips
//   platform.js    desktop / Android / browser differences
import { annotate, briefDue, newThreatAlerts, fetchAll } from './core/index.js';
import { icon } from './icons.js';
import * as platform from './platform.js';
import { currentBrief, renderBrief } from './ui/brief.js';
import { closeDetail, initDetail, showDetail } from './ui/detail.js';
import { $, $$ } from './ui/dom.js';
import { initLists, renderLists } from './ui/lists.js';
import { autoLocate, initLocation, locateByGps, renderLocation } from './ui/location.js';
import * as map from './ui/map.js';
import { initPrepare, openGuide } from './ui/prepare.js';
import { applyTheme, initSettings } from './ui/settings.js';
import { initSources, renderSources } from './ui/sources.js';
import { state, store, syncBackground } from './ui/state.js';
import { initTooltips } from './ui/tooltip.js';

const REFRESH_MS = 10 * 60 * 1000;
const IN_PAGE_ALERT_MS = 60 * 1000;
const SEEN_LIMIT = 2000;

// ---------- rendering ----------

function renderAll() {
  annotate(state.events, state.loc, state.settings.radiusKm);
  map.renderEvents();
  map.renderHome();
  renderLists();
  renderBrief();
  renderSources();
  const selected = state.events.find((e) => e.id === state.selectedId);
  if (selected) showDetail(selected);
}

/** Selecting an event zooms the map to it, highlights its marker and opens the detail view. */
function select(e) {
  state.selectedId = e.id;
  map.showSelected(e);
  showDetail(e);
}

function onDetailClosed() {
  state.selectedId = null;
  map.showSelected(null);
}

function showTab(name) {
  for (const tab of $$('.tabs button')) tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
  for (const pane of $$('[data-pane]')) pane.hidden = pane.dataset.pane !== name;
  if (!$('#detail').hidden) closeDetail();
}

// ---------- data ----------

let loading = false;
let refreshQueued = false;

/** Fetches every feed and re-renders. Calls made while a refresh is running are merged into one more run. */
async function refresh() {
  if (loading) { refreshQueued = true; return; }
  loading = true;
  $('#refreshBtn').disabled = true;
  try {
    Object.assign(state, await fetchAll(state.loc), { loadError: null });
    renderAll();
    alertInPage();
  } catch (err) {
    state.loadError = err;
    renderBrief();
    renderLists();
    console.error(err);
  } finally {
    loading = false;
    $('#refreshBtn').disabled = false;
    if (refreshQueued) { refreshQueued = false; refresh(); }
  }
}

// Desktop and Android send notifications from a background process (electron/background.js, src/runner.js).
// In the browser preview the page has to do it itself, while it is open.
const seen = new Set(store.get('seen', []));
function alertInPage() {
  const { settings, loc } = state;
  if (platform.backgroundAlerts || !settings.notify || !loc || !state.fetchedAt) return;
  for (const n of newThreatAlerts(state.events, seen, settings.notifyLevel)) platform.notify(n.title, n.body);
  store.set('seen', [...seen].slice(-SEEN_LIMIT));
  const now = new Date();
  if (briefDue(now, settings.briefTime, store.get('lastBrief'))) {
    store.set('lastBrief', now.toDateString());
    const b = currentBrief();
    platform.notify(b.title, b.text);
  }
}

// ---------- start-up ----------

function init() {
  applyTheme();
  for (const el of $$('[data-icon]')) el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, Number(el.dataset.size) || 18));
  initTooltips();

  map.initMap({ onSelect: select });
  initLists({
    onSelect: select,
    onHover: map.highlight,
    onFiltersChange: () => { map.renderEvents(); renderLists(); },
  });
  initDetail({
    onClose: onDetailClosed,
    onOpenGuide: (type) => { showTab('prepare'); openGuide(type); },
  });
  initPrepare();
  initSources();
  initSettings({ onRadiusChange: renderAll, onThemeChange: map.renderHome });
  initLocation({ onChange: () => { map.renderHome(); refresh(); } });

  for (const tab of $$('.tabs button')) tab.addEventListener('click', () => showTab(tab.dataset.tab));
  $('#locBtn').addEventListener('click', () => showTab('settings'));
  $('#refreshBtn').addEventListener('click', () => refresh());
  platform.onOpenBrief(() => showTab('near'));

  setInterval(refresh, REFRESH_MS);
  setInterval(alertInPage, IN_PAGE_ALERT_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - state.fetchedAt > REFRESH_MS) refresh();
  });

  // Android 13+ needs a runtime permission before the background process can notify.
  if (state.settings.notify && platform.name === 'android') platform.requestNotifications();

  if (state.loc) {
    map.setView(state.loc.lat, state.loc.lon, 5);
    refresh();
    syncBackground();
    if (state.loc.source !== 'manual') locateByGps({ onlyIfMoved: true });
  } else {
    autoLocate().then((found) => { if (!found) { renderLocation(); refresh(); } });
  }
}

init();

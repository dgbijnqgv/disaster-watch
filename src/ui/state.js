// UI state and its persistence. Everything the views render comes from `state`.
import * as platform from '../platform.js';

/** localStorage wrapper that tolerates storage being unavailable (private mode, cleared site data). */
export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(`dw:${key}`);
      return v == null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`dw:${key}`, JSON.stringify(value)); } catch { /* storage unavailable */ }
  },
};

const DEFAULT_SETTINGS = {
  radiusKm: 300,
  notify: platform.backgroundAlerts,
  notifyLevel: 2,
  briefTime: '07:00',
  minLevel: 1,
  hiddenTypes: [],
  theme: 'light',
};

function savedLocation() {
  const loc = store.get('loc', null);
  if (loc?.name) loc.name = loc.name.replace(/\s*\(approx\.\)$/, ''); // older versions stored this in the name
  return loc;
}

export const state = {
  settings: { ...DEFAULT_SETTINGS, ...store.get('settings', {}) },
  /** @type {{ lat: number, lon: number, name: string, source: 'gps' | 'ip' | 'manual' } | null} */
  loc: savedLocation(),
  /** @type {import('../core/sources.js').DisasterEvent[]} */
  events: [],
  sources: {},
  fetchedAt: 0,
  loadError: null,
  selectedId: null,
};

/** Hands the location and alert preferences to the background process that sends notifications. */
export function syncBackground() {
  const { radiusKm, notify, notifyLevel, briefTime } = state.settings;
  platform.syncBackground({ loc: state.loc, radiusKm, notify, notifyLevel, briefTime });
}

export function saveSettings() {
  store.set('settings', state.settings);
  syncBackground();
}

export function saveLocation() {
  store.set('loc', state.loc);
  syncBackground();
}

/** Whether an event passes the user's World filters (also applied to the map). */
export const passesFilters = (e) => e.level >= state.settings.minLevel && !state.settings.hiddenTypes.includes(e.type);

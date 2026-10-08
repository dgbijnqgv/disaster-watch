// Desktop background worker (runs in the Electron main process, even with the window closed):
// checks for new threats in the user's area every 15 minutes and sends the daily brief.
import { app, Notification } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchAll, annotate, buildBrief, newThreatAlerts, briefDue } from '../src/core/index.js';

const CHECK_MS = 15 * 60 * 1000;
const file = () => join(app.getPath('userData'), 'background.json');

let state = { settings: null, seen: [], lastBrief: null };
let onClick = () => {};
let running = false;

function load() {
  try { state = { ...state, ...JSON.parse(readFileSync(file(), 'utf8')) }; } catch { /* first run */ }
}
function save() {
  try { writeFileSync(file(), JSON.stringify(state)); } catch (err) { console.error('Could not save background state', err); }
}

export function showNotification(title, body) {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body });
  n.on('click', () => onClick());
  n.show();
}

async function check() {
  const s = state.settings;
  if (running || !s?.loc || !s.notify) return;
  running = true;
  try {
    const { events, sources } = await fetchAll(s.loc, { userAgent: `DisasterWatch/${app.getVersion()}` });
    annotate(events, s.loc, s.radiusKm);

    const seen = new Set(state.seen);
    for (const n of newThreatAlerts(events, seen, s.notifyLevel)) showNotification(n.title, n.body);
    state.seen = [...seen].slice(-2000);

    const now = new Date();
    if (briefDue(now, s.briefTime, state.lastBrief)) {
      const b = buildBrief(events, s.loc, { radiusKm: s.radiusKm, sources });
      showNotification(b.title, b.text);
      state.lastBrief = now.toDateString();
    }
    save();
  } catch (err) {
    console.error('Background check failed', err);
  } finally {
    running = false;
  }
}

export function updateSettings(settings) {
  state.settings = settings;
  save();
  check();
}

export function startBackground({ onNotificationClick }) {
  onClick = onNotificationClick;
  load();
  check();
  setInterval(check, CHECK_MS);
  // The brief can fall due between data checks; look once a minute (cheap: only fetches when due).
  setInterval(() => {
    if (state.settings && briefDue(new Date(), state.settings.briefTime, state.lastBrief)) check();
  }, 60 * 1000);
}

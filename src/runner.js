// Android background task (Capacitor Background Runner). Bundled into dist/runner.js.
// Runs about every 15 minutes, even when the app is closed: announces new threats in the
// user's area and sends the daily brief. The app hands over settings via 'saveSettings'.
// Globals CapacitorKV / CapacitorNotifications are provided by the runner environment.
import { fetchAll, annotate, buildBrief, newThreatAlerts, briefDue } from './core/index.js';

const kvGet = (key, fallback) => {
  try { const v = CapacitorKV.get(key)?.value; return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const kvSet = (key, value) => CapacitorKV.set(key, JSON.stringify(value));

let nextId = 1;
function notify(list) {
  if (!list.length) return;
  CapacitorNotifications.schedule(list.map((n) => ({
    id: (Date.now() % 2e9) + nextId++,
    title: n.title,
    body: n.body,
    scheduleAt: new Date(Date.now() + 1000),
  })));
}

addEventListener('saveSettings', (resolve, reject, args) => {
  try {
    kvSet('settings', args);
    resolve();
  } catch (err) {
    reject(err);
  }
});

addEventListener('check', async (resolve, reject) => {
  try {
    const s = kvGet('settings', null);
    if (!s?.loc || !s.notify) return resolve();

    const { events, sources } = await fetchAll(s.loc);
    annotate(events, s.loc, s.radiusKm);

    const seen = new Set(kvGet('seen', []));
    const out = newThreatAlerts(events, seen, s.notifyLevel);
    kvSet('seen', [...seen].slice(-2000));

    const now = new Date();
    if (briefDue(now, s.briefTime, kvGet('lastBrief', null))) {
      const b = buildBrief(events, s.loc, { radiusKm: s.radiusKm, sources });
      out.push({ title: b.title, body: b.text });
      kvSet('lastBrief', now.toDateString());
    }

    notify(out);
    resolve();
  } catch (err) {
    reject(err);
  }
});

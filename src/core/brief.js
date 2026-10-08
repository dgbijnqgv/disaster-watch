// Personalisation: which events matter to this user, the daily brief, and threat notifications.
// Shared by the UI and both background processes (Electron main and the Android runner).
import { LEVELS, PREP, impactRadiusKm } from './hazards.js';
import { compass, distanceKm } from './geo.js';
import { headline, plural, where } from './text.js';

/**
 * Adds the user-relative fields to each event, in place: distanceKm, dir, impactKm,
 * inZone (the user is within reach of its effects) and nearby (within the user's watch radius).
 * @param {import('./sources.js').DisasterEvent[]} events
 * @param {{ lat: number, lon: number } | null} loc
 * @param {number} radiusKm
 */
export function annotate(events, loc, radiusKm) {
  for (const e of events) {
    e.impactKm = impactRadiusKm(e);
    if (!loc) {
      Object.assign(e, { distanceKm: null, dir: '', inZone: false, nearby: false });
      continue;
    }
    e.distanceKm = e.local ? 0 : distanceKm(loc.lat, loc.lon, e.lat, e.lon);
    e.dir = e.local ? '' : compass(loc.lat, loc.lon, e.lat, e.lon);
    e.inZone = e.local || e.distanceKm <= e.impactKm;
    e.nearby = e.inZone || e.distanceKm <= radiusKm;
  }
  return events;
}

/** Sort order for anything shown to the user: threats to them first, then severity, then distance. */
export const byUrgency = (a, b) => (b.inZone - a.inZone) || (b.level - a.level) || ((a.distanceKm ?? 0) - (b.distanceKm ?? 0));

/** Events worth the user's attention: anything that can reach them, plus serious events nearby. */
export const relevant = (e) => e.inZone || (e.nearby && e.level >= 2);

/**
 * What to do about an event, depending on whether it can reach the user and how serious it is.
 * `urgent` is only given when it can reach them: the signs that mean "stop preparing and act".
 * @returns {{ phase: 'now'|'near'|'ready', title: string, steps: string[], urgent?: string }}
 */
export function adviceFor(e) {
  const p = PREP[e.type] ?? PREP.other;
  if (e.inZone && e.level >= 3) return { phase: 'now', title: 'What to do now', steps: p.now, urgent: p.urgent };
  if (e.inZone) return { phase: 'near', title: 'Get ready in case it reaches you', steps: p.near, urgent: p.urgent };
  return { phase: 'ready', title: 'If you are in the area', steps: p.ready };
}

/** The single most important thing to do about an event. */
export const actionFor = (e) => adviceFor(e).steps[0];

/**
 * The daily brief as data. The UI lays it out; notifications use `title` and `text`.
 * @returns {{ status: 'none'|'clear'|'watch'|'action', level: number, title: string, summary: string,
 *   items: object[], minorNearby: number, incomplete: boolean, text: string }}
 */
export function buildBrief(events, loc, { radiusKm = 300, sources } = {}) {
  const items = events.filter(relevant).sort(byUrgency);
  const minorNearby = events.filter((e) => e.nearby && !relevant(e)).length;
  const incomplete = Object.values(sources ?? {}).some((s) => !s.ok);
  // Serious events that can't reach the user raise the brief to "watch", never to "action".
  const level = items.reduce((m, e) => Math.max(m, e.inZone ? e.level : Math.min(e.level, 2)), 0);

  let status; let title; let summary;
  if (!loc) {
    [status, title, summary] = ['none', 'Set your location', 'Disaster Watch needs your location to tell you what could affect you.'];
  } else if (level >= 3) {
    [status, title, summary] = ['action', 'Take action now', `${plural(items.length, 'disaster', 'disasters')} could affect you.`];
  } else if (items.length) {
    [status, title, summary] = ['watch', 'Stay alert', `${plural(items.length, 'disaster is', 'disasters are')} active near you.`];
  } else {
    [status, title, summary] = ['clear', 'No threats near you', `Nothing within ${radiusKm} km needs your attention.`];
  }

  const shown = items.slice(0, 3);
  const top = items.find((e) => e.inZone && e.level >= 2);
  const sentences = shown.map((e) => `${headline(e)} (${where(e).toLowerCase()}).`);
  if (top) sentences.push(`${actionFor(top)}.`);
  if (!shown.length) sentences.push(summary);
  if (incomplete) sentences.push('Some data sources were unavailable, so this brief may be incomplete.');

  return { status, level, title, summary, items: shown, minorNearby, incomplete, text: sentences.join('\n') };
}

/**
 * Notifications for threats in the user's impact zone that have not been announced yet.
 * Adds them to `seen` (a Set of event ids) so each threat is announced once.
 * @returns {{ title: string, body: string }[]}
 */
export function newThreatAlerts(events, seen, minLevel) {
  const fresh = events.filter((e) => e.inZone && e.level >= minLevel && !seen.has(e.id)).sort(byUrgency);
  fresh.forEach((e) => seen.add(e.id));
  if (fresh.length > 2) {
    return [{
      title: `${fresh.length} new disasters could affect you`,
      body: fresh.slice(0, 3).map((e) => `${headline(e)}.`).join('\n'),
    }];
  }
  return fresh.map((e) => ({
    title: headline(e),
    body: `${where(e)}. ${LEVELS[e.level].name} threat.\n${actionFor(e)}.`,
  }));
}

/** True once the user's brief time has passed today and today's brief has not been sent. */
export function briefDue(now, briefTime = '07:00', lastBriefDay = null) {
  const [h, m] = briefTime.split(':').map(Number);
  return lastBriefDay !== now.toDateString() && now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

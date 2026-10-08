// Live hazard feeds, normalised into one event shape.
// Each source has a pure parse function (feed JSON -> events) and a fetch wrapper, so parsing is testable offline.
import { centroid, distanceKm } from './geo.js';
import { getJson } from './http.js';

/**
 * One hazard event, whatever feed it came from.
 * @typedef {object} DisasterEvent
 * @property {string} id           Stable across refreshes: `<source>:<feed id>`.
 * @property {string} source       Human-readable source name, shown to the user.
 * @property {string} type         A key of TYPES in hazards.js.
 * @property {number} level        Threat level 1–4 (see LEVELS).
 * @property {number} lat
 * @property {number} lon
 * @property {string} title        The feed's own title; the fallback wording when no sentence can be built.
 * @property {number} time         Last update, ms since epoch.
 * @property {string} [url]        Page with the official details.
 * @property {string} [detail]     Longer description from the feed.
 * @property {string} [name]       Named events: the fire, storm or volcano name.
 * @property {string} [place]      Where it is, ready to follow a preposition ("Big Horn, Montana", "the Philippines").
 * @property {string} [placePrep]  Preposition for `place` when it is not "in" ("near", "in the").
 * @property {boolean} [prescribed] A planned, controlled burn.
 * @property {number} [mag]        Earthquake magnitude.
 * @property {string} [detailUrl]  USGS detail feed, used to find a ShakeMap.
 * @property {number[][]} [track]  Storm positions so far, [lat, lon] pairs.
 * @property {boolean} [local]     An official alert that covers the user's own location (NWS).
 * @property {string} [headline]   NWS headline.
 * @property {string} [area]       NWS affected zones, ';'-separated.
 * @property {string} [instruction] NWS official instructions.
 * @property {number} [expires]    When an alert ends, ms since epoch.
 */

export const FEEDS = {
  usgs: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson',
  gdacs: 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP',
  eonet: 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=20',
  nws: 'https://api.weather.gov/alerts/active',
};

/** Level 1 plus one for every threshold `value` reaches, capped at 4. */
export const bucket = (value, thresholds) => Math.min(4, 1 + thresholds.filter((t) => value >= t).length);

export const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** Country names read naturally in a sentence ("the United States", "the Philippines"). */
export function countryName(c) {
  if (!c) return null;
  if (/^the\s/i.test(c)) return `the ${c.slice(4)}`;
  const needsThe = /^(united|republic|democratic|central african|dominican|czech)\b|(islands|republic|states|kingdom|emirates)$|^(philippines|netherlands|bahamas|gambia|maldives|comoros)$/i;
  return needsThe.test(c) ? `the ${c}` : c;
}

// ---------- USGS earthquakes ----------

/** USGS place strings: "49 km NNE of Cruz Bay, U.S. Virgin Islands" or "Fiji region". */
export function usgsPlace(place) {
  const m = /^\s*[\d.]+\s*km\s+[NSEW]{1,3}\s+of\s+(.+)$/i.exec(place ?? '');
  if (m) return { place: m[1].trim(), placePrep: 'near' };
  return place ? { place: place.trim(), placePrep: /region$/i.test(place) ? 'in the' : 'near' } : {};
}

const PAGER_LEVEL = { green: 1, yellow: 2, orange: 3, red: 4 };

/** @returns {DisasterEvent[]} */
export function parseUSGS(json) {
  return json.features.map((f) => {
    const p = f.properties;
    const [lon, lat, depth] = f.geometry.coordinates;
    let level = Math.max(bucket(p.mag, [4, 5.5, 6.5]), PAGER_LEVEL[p.alert] ?? 0);
    if (p.tsunami) level = Math.max(level, 3);
    const notes = [
      `Magnitude ${p.mag.toFixed(1)}, depth ${Math.round(depth)} km.`,
      p.tsunami ? 'Tsunami advisory flag raised — check official tsunami warnings.' : '',
      p.felt ? `Felt by ${p.felt} people.` : '',
    ];
    return {
      id: `usgs:${f.id}`, source: 'USGS', type: 'earthquake', level, lat, lon, mag: p.mag, ...usgsPlace(p.place),
      title: `M${p.mag.toFixed(1)} — ${p.place ?? 'Unknown location'}`,
      detail: notes.filter(Boolean).join(' '),
      time: p.time, url: p.url, detailUrl: p.detail,
    };
  });
}

// ---------- GDACS global disaster alerts ----------

const GDACS_TYPES = { EQ: 'earthquake', TC: 'storm', FL: 'flood', VO: 'volcano', DR: 'drought', WF: 'wildfire', TS: 'tsunami' };
const GDACS_LEVEL = { green: 1, orange: 3, red: 4 };

/** @returns {DisasterEvent[]} */
export function parseGDACS(json) {
  const out = [];
  for (const f of json.features) {
    const p = f.properties;
    const type = GDACS_TYPES[p.eventtype] ?? 'other';
    let level = GDACS_LEVEL[String(p.alertlevel).toLowerCase()] ?? 1;
    // GDACS earthquakes duplicate USGS; keep only the ones GDACS flags as serious.
    if (type === 'earthquake' && level < 3) continue;
    const sev = p.severitydata ?? {};
    if (type === 'storm' && sev.severityunit === 'km/h') level = Math.max(level, bucket(sev.severity, [63, 119, 178]));
    const c = centroid(f.geometry);
    if (!c) continue;
    const affected = p.affectedcountries?.length ? `Affected: ${p.affectedcountries.map((a) => a.countryname).join(', ')}` : '';
    out.push({
      id: `gdacs:${p.eventtype}${p.eventid}`, source: 'GDACS', type, level, lat: c[1], lon: c[0],
      title: p.name + (p.country && !p.name.includes(p.country) ? ` (${p.country})` : ''), country: p.country,
      name: type === 'storm' || type === 'volcano' ? p.name : null, place: countryName(p.country),
      detail: [stripHtml(p.htmldescription || p.description), sev.severitytext, affected].filter(Boolean).join('. '),
      time: Date.parse(`${p.datemodified}Z`) || Date.parse(`${p.todate}Z`), url: p.url?.report,
    });
  }
  return out;
}

// ---------- NASA EONET natural events ----------

const EONET_TYPES = { wildfires: 'wildfire', severeStorms: 'storm', volcanoes: 'volcano', floods: 'flood', landslides: 'other', drought: 'drought', snow: 'winter', tempExtremes: 'heat' };

/** EONET titles: "Wildfire <name>, <county>, <state>", "Prescribed Fire <name>, …", "Hurricane <name>", "<name> Volcano, <country>". */
export function eonetPlace(title, type) {
  const parts = String(title).split(',').map((x) => x.trim()).filter(Boolean);
  const head = parts[0] ?? '';
  const place = parts.slice(1).join(', ') || null;
  if (type === 'wildfire') return { name: head.replace(/^(wildfire|prescribed fire)\s*/i, '') || null, place, prescribed: /^prescribed/i.test(head) };
  if (type === 'storm') return { name: head || null, place };
  if (type === 'volcano') return { name: head.replace(/\s*volcano$/i, '') || null, place };
  return { place };
}

function eonetLevel(type, magnitude, title) {
  if (type === 'wildfire') return /^prescribed/i.test(title) ? 1 : magnitude ? bucket(magnitude, [1000, 10000, 100000]) : 1; // acres
  if (type === 'storm') return magnitude ? bucket(magnitude, [34, 64, 96]) : 2; // knots
  return 2;
}

/** @returns {DisasterEvent[]} */
export function parseEONET(json) {
  const out = [];
  for (const ev of json.events) {
    const type = EONET_TYPES[ev.categories[0]?.id];
    if (!type) continue;
    const last = ev.geometry[ev.geometry.length - 1];
    const c = centroid(last);
    if (!c) continue;
    const v = last.magnitudeValue;
    const track = type === 'storm' && ev.geometry.length > 1
      ? ev.geometry.filter((g) => g.type === 'Point').map((g) => [g.coordinates[1], g.coordinates[0]]) : null;
    const size = v ? `${type === 'storm' ? 'Max wind' : 'Size'}: ${Math.round(v).toLocaleString('en')} ${last.magnitudeUnit}` : '';
    out.push({
      id: `eonet:${ev.id}`, source: 'NASA EONET', type, level: eonetLevel(type, v, ev.title), lat: c[1], lon: c[0], track,
      ...eonetPlace(ev.title, type),
      title: ev.title,
      detail: [ev.description, size].filter(Boolean).join('. '),
      time: Date.parse(last.date), url: ev.sources?.[0]?.url ?? ev.link,
    });
  }
  return out;
}

// ---------- US National Weather Service alerts (for the user's own location) ----------

const NWS_TYPES = [
  [/hurricane|tropical storm|typhoon|storm surge/i, 'storm'],
  [/tsunami/i, 'tsunami'],
  [/flood/i, 'flood'],
  [/fire|red flag/i, 'wildfire'],
  [/tornado|thunderstorm|wind|hail|dust|severe|extreme weather/i, 'severe'],
  [/heat/i, 'heat'],
  [/winter|blizzard|ice|snow|freeze|frost|cold|chill/i, 'winter'],
  [/earthquake/i, 'earthquake'],
  [/volcan|ash/i, 'volcano'],
];
const NWS_LEVEL = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1 };

/** Rough bounding box of the US and its territories, where NWS alerts exist. */
export const inUS = ({ lat, lon }) => lat > 15 && lat < 72 && lon > -180 && lon < -64;

/** @returns {DisasterEvent[]} */
export function parseNWS(json, loc) {
  return json.features.map((f) => {
    const p = f.properties;
    const type = NWS_TYPES.find(([re]) => re.test(p.event))?.[1] ?? 'other';
    let level = NWS_LEVEL[p.severity] ?? 1;
    if (/warning/i.test(p.event)) level = Math.max(level, 3);
    else if (/watch/i.test(p.event)) level = Math.max(level, 2);
    const c = centroid(f.geometry) ?? [loc.lon, loc.lat];
    return {
      id: `nws:${p.id}`, source: 'US National Weather Service', type, level, lat: c[1], lon: c[0], local: true,
      title: p.event, headline: p.headline, area: p.areaDesc,
      detail: (p.description ?? '').trim(), instruction: (p.instruction ?? '').trim(),
      time: Date.parse(p.sent), expires: Date.parse(p.ends ?? p.expires),
      url: `https://alerts.weather.gov/search?id=${encodeURIComponent(p.id)}`,
    };
  });
}

// ---------- merging ----------

/** GDACS and EONET often report the same fire or storm. Keep the GDACS record and enrich it from EONET. */
export function mergeGdacsEonet(gdacs, eonet) {
  const out = [...gdacs];
  for (const e of eonet) {
    const lastWord = e.title.split(/\s+/).pop().toLowerCase();
    const dup = gdacs.find((g) => g.type === e.type && (
      distanceKm(g.lat, g.lon, e.lat, e.lon) < (e.type === 'storm' ? 300 : 25)
      || (e.type === 'storm' && lastWord.length > 2 && g.title.toLowerCase().includes(lastWord))));
    if (!dup) { out.push(e); continue; }
    dup.level = Math.max(dup.level, e.level);
    if (e.track && !dup.track) dup.track = e.track;
    if (e.type === 'storm') {
      // EONET has the storm's everyday name ("Hurricane Polo") and its latest position.
      Object.assign(dup, { title: e.title + (dup.country ? ` (${dup.country})` : ''), name: e.name, lat: e.lat, lon: e.lon });
    }
  }
  return out;
}

/** Feeds sometimes list the same fire twice a few hundred metres apart; keep the most recent report. */
export function dropNearDuplicates(events) {
  const kept = [];
  for (const e of [...events].sort((a, b) => b.time - a.time)) {
    if (e.type !== 'earthquake' && kept.some((k) => k.type === e.type && distanceKm(k.lat, k.lon, e.lat, e.lon) < 3)) continue;
    kept.push(e);
  }
  return kept;
}

/**
 * Fetches every source in parallel. A source that fails is reported in `sources` rather than failing the whole update,
 * but if all the global sources fail this throws, so an outage is never shown as "all clear".
 * @param {{ lat: number, lon: number } | null} loc
 * @param {{ userAgent?: string, timeoutMs?: number }} [options]
 * @returns {Promise<{ events: DisasterEvent[], sources: Record<string, { ok: boolean, count?: number, error?: string }>, fetchedAt: number }>}
 */
export async function fetchAll(loc, options = {}) {
  const jobs = {
    usgs: getJson(FEEDS.usgs, options).then(parseUSGS),
    gdacs: getJson(FEEDS.gdacs, options).then(parseGDACS),
    eonet: getJson(FEEDS.eonet, options).then(parseEONET),
    nws: loc && inUS(loc)
      ? getJson(`${FEEDS.nws}?point=${loc.lat.toFixed(4)},${loc.lon.toFixed(4)}`, options).then((j) => parseNWS(j, loc))
      : Promise.resolve([]),
  };
  const names = Object.keys(jobs);
  const settled = await Promise.allSettled(Object.values(jobs));
  const sources = {};
  const got = {};
  settled.forEach((r, i) => {
    got[names[i]] = r.status === 'fulfilled' ? r.value : [];
    sources[names[i]] = r.status === 'fulfilled' ? { ok: true, count: r.value.length } : { ok: false, error: String(r.reason?.message ?? r.reason) };
  });
  if (!sources.usgs.ok && !sources.gdacs.ok && !sources.eonet.ok) throw new Error('No disaster data sources could be reached');
  const events = [...got.usgs, ...dropNearDuplicates(mergeGdacsEonet(got.gdacs, got.eonet)), ...got.nws]
    .filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lon));
  return { events, sources, fetchedAt: Date.now() };
}

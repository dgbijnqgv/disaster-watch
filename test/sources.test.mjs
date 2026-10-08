// Feed parsing and merging, using small synthetic feed responses shaped like each real API.
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bucket, countryName, dropNearDuplicates, eonetPlace, fetchAll, mergeGdacsEonet,
  parseEONET, parseGDACS, parseNWS, parseUSGS, usgsPlace,
} from '../src/core/index.js';

const point = (lon, lat, extra = {}) => ({ type: 'Point', coordinates: [lon, lat], ...extra });

test('bucket counts thresholds reached, from 1 to 4', () => {
  assert.equal(bucket(1, [2, 3, 4]), 1);
  assert.equal(bucket(3, [2, 3, 4]), 3);
  assert.equal(bucket(99, [2, 3, 4]), 4);
});

test('USGS place strings become a place and a preposition', () => {
  assert.deepEqual(usgsPlace('12 km NNE of Testtown, XY'), { place: 'Testtown, XY', placePrep: 'near' });
  assert.deepEqual(usgsPlace('Test Islands region'), { place: 'Test Islands region', placePrep: 'in the' });
  assert.deepEqual(usgsPlace(null), {});
});

test('country names read naturally in a sentence', () => {
  assert.equal(countryName('Philippines'), 'the Philippines');
  assert.equal(countryName('United States'), 'the United States');
  assert.equal(countryName('Solomon Islands'), 'the Solomon Islands');
  assert.equal(countryName('Chile'), 'Chile');
  assert.equal(countryName(''), null);
});

test('USGS: level from magnitude, PAGER alert and tsunami flag', () => {
  const feature = (props) => ({ id: 'x1', geometry: point(10, 20, { coordinates: [10, 20, 33] }), properties: { mag: 3, place: '5 km N of Here', time: 1, url: 'https://example.org/e', detail: 'https://example.org/d', ...props } });
  const [minor, pager, tsunami] = parseUSGS({ features: [feature({}), feature({ mag: 4.2, alert: 'orange' }), feature({ mag: 5, tsunami: 1 })] });
  assert.equal(minor.level, 1);
  assert.equal(pager.level, 3);
  assert.equal(tsunami.level, 3);
  assert.match(tsunami.detail, /Tsunami/);
  assert.deepEqual([minor.id, minor.lat, minor.lon, minor.place, minor.detailUrl], ['usgs:x1', 20, 10, 'Here', 'https://example.org/d']);
});

test('GDACS: skips minor earthquakes, rates storms by wind, places polygons at their centroid', () => {
  const f = (props, geometry = point(120, 15)) => ({ geometry, properties: { eventid: 1, name: 'Event', alertlevel: 'Green', datemodified: '2030-01-01T00:00:00', url: { report: 'https://example.org/r' }, ...props } });
  const square = { type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2]]] };
  const events = parseGDACS({
    features: [
      f({ eventtype: 'EQ' }),
      f({ eventtype: 'TC', eventid: 2, name: 'Tropical Cyclone ZED-30', country: 'Philippines', severitydata: { severity: 130, severityunit: 'km/h' } }),
      f({ eventtype: 'FL', eventid: 3, country: 'Testland' }, square),
      f({ eventtype: 'VO', eventid: 4 }, null),
    ],
  });
  assert.deepEqual(events.map((e) => e.id), ['gdacs:TC2', 'gdacs:FL3']);
  const [storm, flood] = events;
  assert.equal(storm.level, 3);
  assert.equal(storm.place, 'the Philippines');
  assert.equal(storm.name, 'Tropical Cyclone ZED-30');
  assert.deepEqual([flood.lat, flood.lon], [1, 1]);
  assert.equal(flood.time, Date.UTC(2030, 0, 1));
});

test('EONET: fire size and storm wind set the level; prescribed burns stay low; tracks are kept', () => {
  const ev = (id, category, title, geometry) => ({ id, title, categories: [{ id: category }], geometry, sources: [{ url: 'https://example.org/s' }] });
  const at = (lon, lat, magnitudeValue, date = '2030-01-01T00:00:00Z') => ({ ...point(lon, lat), date, magnitudeValue, magnitudeUnit: 'x' });
  const events = parseEONET({
    events: [
      ev('A', 'wildfires', 'Wildfire Pine, Some County, Somestate', [at(-110, 40, 20000)]),
      ev('B', 'wildfires', 'Prescribed Fire Oak, Some County', [at(-111, 40, 500000)]),
      ev('C', 'severeStorms', 'Hurricane Zed', [at(-60, 20, 50), at(-62, 22, 100)]),
      ev('D', 'dustHaze', 'Dust', [at(0, 0)]),
    ],
  });
  assert.deepEqual(events.map((e) => e.level), [3, 1, 4]);
  assert.deepEqual([events[0].name, events[0].place], ['Pine', 'Some County, Somestate']);
  assert.equal(events[1].prescribed, true);
  assert.deepEqual(events[2].track, [[20, -60], [22, -62]]);
  assert.deepEqual([events[2].lat, events[2].lon], [22, -62]);
});

test('EONET titles are split into name and place', () => {
  assert.deepEqual(eonetPlace('Test Peak Volcano, Testland', 'volcano'), { name: 'Test Peak', place: 'Testland' });
  assert.deepEqual(eonetPlace('Flooding somewhere', 'flood'), { place: null });
});

test('NWS: warnings are at least High, watches at least Moderate, and cover the user', () => {
  const alert = (event, severity, geometry = null) => ({ geometry, properties: { id: `id-${event}`, event, severity, sent: '2030-01-01T00:00:00Z', areaDesc: 'A; B' } });
  const loc = { lat: 35, lon: -100 };
  const [warning, watch, other] = parseNWS({ features: [alert('Flash Flood Warning', 'Moderate'), alert('Winter Storm Watch', 'Minor'), alert('Air Quality Alert', 'Unknown')] }, loc);
  assert.deepEqual([warning.type, warning.level, warning.local], ['flood', 3, true]);
  assert.deepEqual([watch.type, watch.level], ['winter', 2]);
  assert.deepEqual([other.type, other.level], ['other', 1]);
  assert.deepEqual([warning.lat, warning.lon], [35, -100]);
});

test('GDACS and EONET reports of the same storm or fire are merged', () => {
  const g = (o) => ({ source: 'GDACS', level: 1, time: 1, ...o });
  const storm = g({ id: 'g1', type: 'storm', title: 'Tropical Cyclone ZED-30', lat: 10, lon: 10, country: 'Testland' });
  const fire = g({ id: 'g2', type: 'wildfire', title: 'Forest fire', lat: 40, lon: -110 });
  const eonet = [
    { id: 'e1', type: 'storm', title: 'Hurricane Zed', name: 'Hurricane Zed', lat: 30, lon: 30, level: 4, track: [[1, 1], [2, 2]] },
    { id: 'e2', type: 'wildfire', title: 'Wildfire Near', lat: 40.1, lon: -110, level: 2 },
    { id: 'e3', type: 'wildfire', title: 'Wildfire Far', lat: 45, lon: -100, level: 1 },
  ];
  const merged = mergeGdacsEonet([storm, fire], eonet);
  assert.deepEqual(merged.map((e) => e.id), ['g1', 'g2', 'e3']);
  assert.deepEqual([storm.level, storm.name, storm.lat, storm.title], [4, 'Hurricane Zed', 30, 'Hurricane Zed (Testland)']);
  assert.equal(fire.level, 2);
});

test('near-duplicate reports keep the latest; earthquakes are never merged', () => {
  const e = (id, type, lat, time) => ({ id, type, lat, lon: 0, time });
  const kept = dropNearDuplicates([e('old', 'wildfire', 0, 1), e('new', 'wildfire', 0.001, 2), e('q1', 'earthquake', 0, 1), e('q2', 'earthquake', 0, 2)]);
  assert.deepEqual(kept.map((x) => x.id).sort(), ['new', 'q1', 'q2']);
});

// ---------- fetchAll, with the network replaced ----------

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function stubFeeds(overrides = {}) {
  const bodies = {
    'earthquake.usgs.gov': { features: [] },
    'www.gdacs.org': { features: [] },
    'eonet.gsfc.nasa.gov': { events: [] },
    'api.weather.gov': { features: [] },
    ...overrides,
  };
  const requested = [];
  globalThis.fetch = async (url) => {
    const host = new URL(url).host;
    requested.push(host);
    const body = bodies[host];
    if (body instanceof Error) throw body;
    return { ok: body !== 500, status: body === 500 ? 500 : 200, json: async () => body };
  };
  return requested;
}

test('fetchAll reports each source and only asks the NWS about US locations', async () => {
  let requested = stubFeeds();
  const r = await fetchAll({ lat: 48.8, lon: 2.3 });
  assert.deepEqual(Object.values(r.sources).map((s) => s.ok), [true, true, true, true]);
  assert.ok(!requested.includes('api.weather.gov'));

  requested = stubFeeds();
  await fetchAll({ lat: 34, lon: -118 });
  assert.ok(requested.includes('api.weather.gov'));
});

test('fetchAll keeps going when one source fails, and throws when all global sources fail', async () => {
  stubFeeds({ 'www.gdacs.org': 500 });
  const r = await fetchAll(null);
  assert.equal(r.sources.gdacs.ok, false);
  assert.match(r.sources.gdacs.error, /HTTP 500/);
  assert.equal(r.sources.usgs.ok, true);

  const down = new Error('offline');
  stubFeeds({ 'earthquake.usgs.gov': down, 'www.gdacs.org': down, 'eonet.gsfc.nasa.gov': down });
  await assert.rejects(fetchAll(null), /No disaster data sources/);
});

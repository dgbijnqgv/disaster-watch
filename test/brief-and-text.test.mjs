// Checks that descriptions, briefs and alerts are generated from whatever the feeds report,
// using synthetic events (no real, dated disasters are involved).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PREP, actionFor, adviceFor, annotate, buildBrief, headline, newThreatAlerts, briefDue, where } from '../src/core/index.js';

const home = { lat: 34, lon: -118, name: 'Testville' };
const ev = (o) => ({ id: Math.random().toString(36), source: 'TEST', level: 1, lat: 34, lon: -118, time: Date.now(), title: 'Raw feed title', ...o });

test('every hazard type gets a sentence, or falls back to the feed title', () => {
  const cases = [
    [ev({ type: 'earthquake', mag: 6.2, place: 'Someplace, XY', placePrep: 'near' }), 'A strong magnitude 6.2 earthquake struck near Someplace, XY'],
    [ev({ type: 'earthquake', mag: 4.1, place: 'Middle Ridge', placePrep: 'near' }), 'A light magnitude 4.1 earthquake struck near Middle Ridge'],
    [ev({ type: 'wildfire', name: 'Pine', place: 'Some County, Somestate' }), 'The Pine wildfire is burning in Some County, Somestate'],
    [ev({ type: 'wildfire', prescribed: true, place: 'Some County' }), 'A planned burn is underway in Some County'],
    [ev({ type: 'wildfire', source: 'GDACS', place: 'Somecountry' }), 'Wildfires are burning in Somecountry'],
    [ev({ type: 'storm', name: 'Hurricane Zed', place: 'Somecountry' }), 'Hurricane Zed is active near Somecountry'],
    [ev({ type: 'storm', source: 'GDACS', name: 'Tropical Cyclone QUX-31' }), 'Tropical Cyclone Qux is active at sea'],
    [ev({ type: 'storm', name: 'Tropical Storm Zed' }), 'Tropical Storm Zed is active at sea'],
    [ev({ type: 'flood', place: 'the United States' }), 'Flooding is affecting the United States'],
    [ev({ type: 'volcano', name: 'Mount Test' }), 'Mount Test volcano is active'],
    [ev({ type: 'flood', local: true, title: 'Flash Flood Warning' }), 'A flash flood warning is in effect for your area'],
    [ev({ type: 'other', local: true, title: 'Air Quality Alert' }), 'An air quality alert is in effect for your area'],
    [ev({ type: 'flood' }), 'Raw feed title'],
    [ev({ type: 'earthquake' }), 'Raw feed title'],
    [ev({ type: 'other', title: 'Unusual event' }), 'Unusual event'],
  ];
  for (const [e, want] of cases) assert.equal(headline(e), want);
});

test('distance is described in words', () => {
  const [e] = annotate([ev({ type: 'wildfire', lat: 35, lon: -118 })], home, 300);
  assert.match(where(e), /^111 km north of you$/);
});

test('brief: clear, watch and action states', () => {
  const far = ev({ type: 'earthquake', mag: 3, lat: 35.5, lon: -118 });
  let b = buildBrief(annotate([far], home, 300), home, { radiusKm: 300 });
  assert.equal(b.status, 'clear');
  assert.equal(b.minorNearby, 1);
  assert.equal(b.items.length, 0);

  const moderate = ev({ type: 'flood', level: 2, lat: 35, lon: -118, place: 'Somewhere' });
  b = buildBrief(annotate([far, moderate], home, 300), home, { radiusKm: 300 });
  assert.equal(b.status, 'watch');

  const warning = ev({ type: 'flood', level: 3, local: true, title: 'Flash Flood Warning' });
  b = buildBrief(annotate([far, moderate, warning], home, 300), home, { radiusKm: 300 });
  assert.equal(b.status, 'action');
  assert.equal(b.items[0], warning);
  assert.match(b.text, /flash flood warning is in effect/);
  assert.doesNotMatch(b.text, /\p{Extended_Pictographic}/u);
});

test('advice depends on whether the event can reach the user and how serious it is', () => {
  const [far, close, serious] = annotate([
    ev({ type: 'wildfire', level: 3, lat: 40, lon: -118 }),
    ev({ type: 'wildfire', level: 2, lat: 34.1, lon: -118 }),
    ev({ type: 'wildfire', level: 3, lat: 34.1, lon: -118 }),
  ], home, 300);
  assert.deepEqual([far, close, serious].map((e) => adviceFor(e).phase), ['ready', 'near', 'now']);
  assert.equal(adviceFor(far).urgent, undefined);
  assert.match(adviceFor(close).urgent, /Leave at once/);
  assert.equal(actionFor(close), adviceFor(close).steps[0]);
});

test('every hazard has advice for each phase', () => {
  for (const [type, p] of Object.entries(PREP)) {
    for (const phase of ['ready', 'now', 'near']) assert.ok(p[phase]?.length >= 2, `${type}.${phase}`);
    assert.ok(p.urgent, `${type}.urgent`);
  }
});

test('brief warns when sources are down', () => {
  const b = buildBrief([], home, { sources: { a: { ok: true }, b: { ok: false } } });
  assert.equal(b.incomplete, true);
});

test('alerts fire once per threat', () => {
  const seen = new Set();
  const list = annotate([ev({ type: 'wildfire', level: 3, lat: 34.1, lon: -118, name: 'Oak', place: 'Here' })], home, 300);
  assert.equal(newThreatAlerts(list, seen, 2).length, 1);
  assert.equal(newThreatAlerts(list, seen, 2).length, 0);
});

test('daily brief timing', () => {
  const d = new Date(2030, 0, 5, 8, 0);
  assert.equal(briefDue(d, '07:00', null), true);
  assert.equal(briefDue(d, '09:00', null), false);
  assert.equal(briefDue(d, '07:00', d.toDateString()), false);
});

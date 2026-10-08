// Event pictures, geometry helpers and the HTML helpers that keep feed text safe.
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { centroid, compass, distanceKm, eventImage } from '../src/core/index.js';
import { esc, paragraphs, safeUrl, timeAgo } from '../src/ui/dom.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test('distance, direction and centroid', () => {
  assert.equal(Math.round(distanceKm(0, 0, 1, 0)), 111);
  assert.equal(compass(0, 0, 1, 1), 'NE');
  assert.equal(compass(0, 0, -1, 0), 'S');
  assert.deepEqual(centroid({ type: 'Polygon', coordinates: [[[0, 0], [4, 0], [4, 2], [0, 2]]] }), [2, 1]);
  assert.equal(centroid(null), null);
});

test('non-earthquake events get a NASA satellite view of the latest full day around them', async () => {
  const img = await eventImage({ type: 'wildfire', lat: 40, lon: -110, time: Date.now() });
  const url = new URL(img.src);
  assert.equal(url.host, 'gibs.earthdata.nasa.gov');
  const [south, west, north, east] = url.searchParams.get('BBOX').split(',').map(Number);
  assert.ok(south < 40 && north > 40 && west < -110 && east > -110);
  assert.match(url.searchParams.get('LAYERS'), /Thermal_Anomalies/); // fires are marked
  assert.equal(url.searchParams.get('TIME'), new Date(Date.now() - 86400000).toISOString().slice(0, 10));
  assert.match(img.caption, /active fires/);
});

test('earthquakes use the USGS ShakeMap when one exists, and nothing otherwise', async () => {
  const shakemap = 'https://example.org/intensity.jpg';
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ properties: { products: { shakemap: [{ contents: { 'download/intensity.jpg': { url: shakemap } } }] } } }) });
  const img = await eventImage({ type: 'earthquake', lat: 1, lon: 1, detailUrl: 'https://example.org/d', url: 'https://example.org/e' });
  assert.equal(img.src, shakemap);

  globalThis.fetch = async () => ({ ok: true, json: async () => ({ properties: { products: {} } }) });
  assert.equal(await eventImage({ type: 'earthquake', lat: 1, lon: 1, detailUrl: 'https://example.org/d' }), null);
  assert.equal(await eventImage({ type: 'earthquake', lat: 1, lon: 1 }), null);
});

test('feed text is escaped and feed links must be web addresses', () => {
  assert.equal(esc('<img src=x onerror="a">'), '&lt;img src=x onerror=&quot;a&quot;&gt;');
  assert.equal(safeUrl('https://example.org'), 'https://example.org');
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl(undefined), null);
});

test('hard-wrapped feed text becomes paragraphs', () => {
  assert.equal(paragraphs('one\ntwo\n\nthree <b>'), '<p>one two</p><p>three &lt;b&gt;</p>');
  assert.equal(paragraphs(''), '');
});

test('relative times', () => {
  assert.equal(timeAgo(Date.now()), 'just now');
  assert.equal(timeAgo(Date.now() - 3 * 3600000), '3 h ago');
  assert.equal(timeAgo(Date.now() - 5 * 86400000), '5 days ago');
  assert.equal(timeAgo(Number.NaN), '');
});

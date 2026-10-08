// Pictures for an event, from public-domain sources that cover any event anywhere:
// USGS ShakeMaps for earthquakes and NASA satellite imagery (GIBS) for everything else.
import { getJson } from './http.js';

const GIBS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';
// Half-height of the satellite view in degrees of latitude, sized to what the hazard looks like from space.
const SPAN = { storm: 7, flood: 2.5, wildfire: 1, volcano: 0.8, drought: 4, severe: 3, winter: 3, heat: 3, tsunami: 2, other: 2 };
const FIRE_TYPES = ['wildfire', 'volcano'];
const DAY = 86400000;

const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
const shortDay = (t) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' });

// Satellite true-colour view around the event, with active-fire detections for fires and volcanoes.
// Uses the most recent complete day of imagery, or the event's own day if it ended earlier.
function satellite(e, width = 640, height = 360) {
  const day = Math.min(Date.now() - DAY, e.time || Infinity);
  const dLat = SPAN[e.type] ?? 2;
  const dLon = (dLat * width) / height / Math.max(0.3, Math.cos((e.lat * Math.PI) / 180));
  const [south, west, north, east] = [e.lat - dLat, e.lon - dLon, e.lat + dLat, e.lon + dLon].map((v) => Number(v.toFixed(3)));
  const layers = [
    'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    'VIIRS_NOAA20_CorrectedReflectance_TrueColor', // drawn over SNPP so each fills the other's swath gaps
    ...(FIRE_TYPES.includes(e.type) ? ['VIIRS_NOAA20_Thermal_Anomalies_375m_All'] : []),
    'Reference_Features_15m',
  ];
  const q = new URLSearchParams({
    SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.3.0', LAYERS: layers.join(','), STYLES: '',
    CRS: 'EPSG:4326', BBOX: [south, west, north, east].join(','), WIDTH: width, HEIGHT: height, FORMAT: 'image/jpeg', TIME: isoDay(day),
  });
  return {
    src: `${GIBS}?${q}`,
    caption: `Satellite view, ${shortDay(day)}${FIRE_TYPES.includes(e.type) ? '. Red dots are active fires' : ''}`,
    credit: 'NASA',
    link: `https://worldview.earthdata.nasa.gov/?v=${[west, south, east, north].join(',')}&t=${isoDay(day)}`,
  };
}

// USGS ShakeMap: a map of how strongly the ground shook. Only published for significant earthquakes.
async function shakeMap(e) {
  if (!e.detailUrl) return null;
  const j = await getJson(e.detailUrl, { timeoutMs: 10000 });
  const url = j.properties?.products?.shakemap?.[0]?.contents?.['download/intensity.jpg']?.url;
  return url ? { src: url, caption: 'How strongly the ground shook', credit: 'USGS ShakeMap', link: e.url, fit: 'contain' } : null;
}

export async function eventImage(e) {
  if (!Number.isFinite(e.lat) || !Number.isFinite(e.lon)) return null;
  if (e.type === 'earthquake') return shakeMap(e).catch(() => null);
  return satellite(e);
}

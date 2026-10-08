// Small geographic helpers. Coordinates are decimal degrees; GeoJSON positions are [lon, lat].

const RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two points, in km. */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Eight-point compass direction from the first point to the second ('N', 'NE', …). */
export function compass(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
  const x = Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) - Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
  const deg = (Math.atan2(y, x) / RAD + 360) % 360;
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}

/**
 * A representative [lon, lat] for a GeoJSON geometry: the point itself, or the average of a polygon's outer ring.
 * Returns null for geometry it cannot place.
 */
export function centroid(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Point') return geometry.coordinates;
  const ring = geometry.type === 'Polygon' ? geometry.coordinates[0]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates[0][0] : null;
  if (!ring?.length) return null;
  const sum = ring.reduce((s, c) => [s[0] + c[0], s[1] + c[1]], [0, 0]);
  return [sum[0] / ring.length, sum[1] / ring.length];
}

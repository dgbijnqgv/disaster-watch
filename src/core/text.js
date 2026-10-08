// Plain-language wording for events. Everything is built from the event's own feed fields by general rules,
// falling back to the feed's title whenever a sentence can't be formed, so it works for any event on any day.

const DIRECTIONS = { N: 'north', NE: 'northeast', E: 'east', SE: 'southeast', S: 'south', SW: 'southwest', W: 'west', NW: 'northwest' };

const startsWithVowel = (word) => /^[aeiou]/i.test(word);
const withArticle = (phrase) => `${startsWithVowel(phrase) ? 'An' : 'A'} ${phrase}`;

/** USGS / Richter descriptive classes. */
export const quakeClass = (m) => (m >= 8 ? 'great' : m >= 7 ? 'major' : m >= 6 ? 'strong' : m >= 5 ? 'moderate' : m >= 4 ? 'light' : 'minor');

/** GDACS writes storms as "Tropical Cyclone POLO-26": drop the year code and the capitals. */
export const stormName = (name) => name
  .replace(/\s*\(.*\)$/, '')
  .replace(/-\d{2}\b/, '')
  .replace(/\b([A-Z])([A-Z]+)\b/g, (_, first, rest) => first + rest.toLowerCase());

/** Where an annotated event is relative to the user, e.g. "114 km northwest of you". */
export function where(e) {
  if (e.local) return 'In your area';
  if (e.distanceKm == null) return '';
  return `${Math.round(e.distanceKm).toLocaleString('en')} km ${DIRECTIONS[e.dir] ?? e.dir} of you`;
}

/** One plain sentence describing any event, e.g. "The Pine wildfire is burning in Some County, Somestate". */
export function headline(e) {
  const at = (prep = 'in') => (e.place ? ` ${e.placePrep ?? prep} ${e.place}` : '');
  switch (e.type) {
    case 'earthquake':
      if (!Number.isFinite(e.mag)) break;
      return `${withArticle(quakeClass(e.mag))} magnitude ${e.mag.toFixed(1)} earthquake struck${at('near')}`;
    case 'wildfire':
      if (e.local) break;
      if (e.prescribed) return `A planned burn is underway${at()}`;
      if (!e.place) return e.title;
      if (e.source === 'GDACS') return `Wildfires are burning in ${e.place}`;
      return `${e.name ? `The ${e.name} wildfire` : 'A wildfire'} is burning in ${e.place}`;
    case 'storm':
      if (e.local) break;
      return e.name ? `${stormName(e.name)} is active${e.place ? ` near ${e.place}` : ' at sea'}` : e.title;
    case 'flood':
      if (e.local) break;
      return e.place ? `Flooding is affecting ${e.place}` : e.title;
    case 'volcano':
      if (e.name) return `${e.name} volcano is active${at()}`;
      return e.place ? `A volcano is active in ${e.place}` : e.title;
    case 'drought':
      return e.place ? `Drought is affecting ${e.place}` : e.title;
    default:
  }
  // Official alerts for the user's own area are named by the alert itself ("Flash Flood Warning").
  if (e.local) return `${withArticle(e.title.toLowerCase())} is in effect for your area`;
  return e.title;
}

/** "1 disaster", "3 disasters". */
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

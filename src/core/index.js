// Platform-independent core, shared by the UI, the desktop background process (Electron main)
// and the Android background runner. No DOM, Electron or Capacitor APIs in here.
//
//   hazards.js  threat levels, hazard types, preparedness guidance, impact radius
//   sources.js  live feeds (USGS, GDACS, NASA EONET, NWS) -> one event shape
//   text.js     plain-language sentences about events
//   brief.js    what matters to this user, the daily brief, threat notifications
//   geo.js      distances and directions
//   http.js     JSON fetching that works in every runtime
//   media.js    pictures of an event (NASA satellite imagery, USGS ShakeMaps)
export * from './hazards.js';
export * from './geo.js';
export * from './http.js';
export * from './sources.js';
export * from './text.js';
export * from './brief.js';
export * from './media.js';

# Disaster Watch

Installable app (Windows, macOS, Android) showing live natural disasters on a world map, with personal threat levels, "what to do" guidance, background alerts and an ultra-short daily brief.

All disaster data is live — nothing about current events is bundled in the app. No API keys needed.

Credits for libraries, data and advice: [CREDITS.md](CREDITS.md). How AI was used: [AI-DISCLOSURE.md](AI-DISCLOSURE.md).

## Contributors

- Lucas Horton
- Xiaofeng Ding
- Ismael Amanullah

## Build

Requires Node 22+.

```bash
npm install
npm run icons       # once, or after changing src/icon.svg
npm run desktop     # run the desktop app in development
npm run dist:win    # Windows installer  -> release/Disaster Watch Setup x.y.z.exe
npm run dist:mac    # macOS .dmg (must run on a Mac)
npm run android     # sync and open the Android project in Android Studio
npm run web         # browser preview at http://localhost:5173 (development only)
```

**Android:** install [Android Studio](https://developer.android.com/studio), run `npm run android`, then *Build → Generate Signed App Bundle* for Google Play (or *Run* for a phone/emulator).

## How it works

| | Desktop (Electron) | Android (Capacitor) |
|---|---|---|
| Location | OS location service, falls back to approximate IP location | Native GPS permission, same fallback |
| Alerts when closed | Keeps running in the system tray; starts at sign-in (user can turn off) | Background task every ~15 min (WorkManager) |
| Notifications | Native Windows / macOS notifications | Android notifications |
| Daily brief | At the user's chosen time; sent on next start if the computer was off | At the first background run after the chosen time |

- **Threat levels** (Low / Moderate / High / Extreme) come from each source's own severity data (GDACS alert level, USGS magnitude + PAGER alert + tsunami flag, storm wind speed, fire size, NWS severity).
- **Your area**: each hazard has an estimated impact radius (grows with magnitude / storm strength). Events whose impact area covers the user are flagged and trigger alerts at or above the user's chosen level. Each threat is announced once.
- If every data source is unreachable the app reports an error instead of "all clear"; partial outages are stated in the brief.

## Code

```
src/
  core/            platform-independent logic, shared by the UI and both background processes
    sources.js       live feeds -> one event shape (pure parsers + fetch; see the DisasterEvent typedef)
    hazards.js       threat levels, hazard types, preparedness guidance, impact radius
    text.js          plain-language sentences about events ("The Pine wildfire is burning in …")
    brief.js         what matters to this user, the daily brief, threat notifications
    media.js         event pictures (NASA satellite imagery, USGS ShakeMaps)
    geo.js, http.js  distances/directions; JSON fetching that works in every runtime
  ui/              the interface, one module per view (map, brief, lists, detail, prepare, settings, location, sources)
  app.js           wires the views together and owns the refresh cycle
  platform.js      location / notifications / background hand-off for desktop, Android and browser
  runner.js        Android background task
electron/          desktop shell (main.js), background worker (background.js), preload bridge
android/           generated Android project (permissions in app/src/main/AndroidManifest.xml)
scripts/           build.mjs bundles src/ into dist/; icons.mjs generates app icons
test/              node:test suites, all offline with synthetic data
```

Nothing situation-dependent is written into the code: every event, and every sentence about it, is built at run time from what the feeds report. When the data needed for a sentence is missing, the feed's own title is shown instead.

## Development

```bash
npm test            # unit tests (offline: feeds are stubbed with synthetic responses)
npm run coverage    # tests with a coverage report
npm run lint        # ESLint
npm run check       # lint + tests + build; run before sharing a build
```
## Data sources

- [USGS](https://earthquake.usgs.gov/earthquakes/feed/) earthquakes M2.5+, past week
- [GDACS](https://www.gdacs.org/) global disaster alerts (UN / EU JRC)
- [NASA EONET](https://eonet.gsfc.nasa.gov/) wildfires, storms and tracks, volcanoes
- [US National Weather Service](https://www.weather.gov/documentation/services-web-api) official alerts for the user's location (US only)
- Event pictures (public domain): [NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/) satellite imagery with active-fire detections, and [USGS ShakeMaps](https://earthquake.usgs.gov/data/shakemap/) for significant earthquakes (`src/core/media.js`)
- Map © OpenStreetMap contributors; place names via BigDataCloud and Nominatim; IP fallback via GeoJS

## Before public release

- **Map tiles and place search:** the free OpenStreetMap tile server and Nominatim forbid heavy use by distributed apps. Switch to a commercial provider (e.g. MapTiler, Stadia Maps, Thunderforest for tiles; their geocoding APIs for search) — the URLs are in `src/ui/map.js` and `src/ui/location.js` (update the list in `src/ui/sources.js` too).
- **Code signing:** unsigned Windows installers trigger SmartScreen warnings; macOS apps must be signed and notarized (Apple Developer account); Android needs a release keystore.
- **Store listings:** Google Play requires a privacy policy (the app uses location) and a declaration for background work.
- Disaster Watch is an awareness tool, not an official warning service; the app says so in Settings and the brief defers to local authorities.

# Credits

Disaster Watch is made by Lucas Horton, Xiaofeng Ding and Ismael Amanullah.

Disaster Watch is built on the open-source software, public data services and public safety advice listed here.
How AI was used to build it is described in [AI-DISCLOSURE.md](AI-DISCLOSURE.md).

## Languages

JavaScript (ES2023 modules), HTML and CSS.

## Open-source libraries in the app

| Library | Version | License | Used for |
|---|---|---|---|
| [Leaflet](https://leafletjs.com/) | 1.9.4 | BSD-2-Clause | The interactive world map, markers and tooltips |
| [Electron](https://www.electronjs.org/) | 44.4.4 | MIT | The Windows and macOS desktop app, tray icon and notifications |
| [Capacitor](https://capacitorjs.com/) (`@capacitor/core`, `/android`, `/cli`) | 8.5.2 | MIT | The Android app |
| [@capacitor/geolocation](https://capacitorjs.com/docs/apis/geolocation) | 8.2.2 | MIT | GPS location on Android |
| [@capacitor/local-notifications](https://capacitorjs.com/docs/apis/local-notifications) | 8.3.1 | MIT | Notifications on Android |
| [@capacitor/background-runner](https://capacitorjs.com/docs/apis/background-runner) | 3.0.0 | MIT | Checking for threats in the background on Android |

## Development tools

| Tool | Version | License | Used for |
|---|---|---|---|
| [esbuild](https://esbuild.github.io/) | 0.28.2 | MIT | Bundling the source code (`scripts/build.mjs`) |
| [electron-builder](https://www.electron.build/) | 26.15.3 | MIT | Building the Windows installer and macOS app |
| [sharp](https://sharp.pixelplumbing.com/) | 0.35.4 | Apache-2.0 | Generating the app icons from `src/icon.svg` (`scripts/icons.mjs`) |
| [ESLint](https://eslint.org/) with `@eslint/js` and `globals` | 10.11.0 | MIT | Checking code quality |
| Node.js built-in test runner (`node:test`) | Node 22+ | MIT | Unit tests |
| [Claude Code](https://claude.com/claude-code) (Anthropic) | — | — | AI coding assistant; see [AI-DISCLOSURE.md](AI-DISCLOSURE.md) |

## Live data services

No data about disasters is stored in the app; it is fetched live from these services every time.

| Service | Run by | Provides |
|---|---|---|
| [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/earthquakes/feed/) | U.S. Geological Survey | Earthquakes M2.5+ worldwide, past week |
| [GDACS](https://www.gdacs.org/) | United Nations and European Commission | Alerts for cyclones, floods, volcanoes, droughts and wildfires |
| [EONET](https://eonet.gsfc.nasa.gov/) | NASA | Wildfires, storms and volcanoes tracked from space |
| [National Weather Service API](https://www.weather.gov/documentation/services-web-api) | U.S. NOAA | Official alerts for the user's location (United States only) |
| [GIBS / Worldview](https://worldview.earthdata.nasa.gov/) | NASA | Satellite pictures of events, with active fires marked (public domain) |
| [ShakeMap](https://earthquake.usgs.gov/data/shakemap/) | U.S. Geological Survey | Shaking-intensity maps for significant earthquakes (public domain) |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles and [Nominatim](https://nominatim.org/) | OpenStreetMap contributors | The map (© OpenStreetMap contributors, ODbL) and place search |
| [BigDataCloud](https://www.bigdatacloud.com/) | BigDataCloud | The name of the user's location |
| [GeoJS](https://www.geojs.io/) | GeoJS | Approximate location when the device cannot provide one |

## Safety advice

The preparation steps, safety tips and go-bag checklist (`src/core/hazards.js`) are written in plain language and
adapted from public emergency-preparedness advice by [Ready.gov](https://www.ready.gov/) (U.S. FEMA) and the
[American Red Cross](https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html).

## Icons and design

The app icon and all interface icons (`src/icon.svg`, `src/icons.js`) were drawn for this project as simple SVG paths.
The app uses the device's system font. No third-party images, fonts or icon sets are bundled.

The full list is also inside the app: **Sources** (next to Refresh) or **Settings → About**.

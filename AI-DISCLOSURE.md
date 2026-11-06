# AI Disclosure

The Congressional App Challenge allows AI tools as long as all AI use is fully disclosed. This file describes that use.

## Tool used

**Claude Code** by Anthropic (the Claude AI model), an AI coding assistant that reads and edits files in a project
folder. It was used between September and October 2026.

## What the AI did

Working from the student's instructions, Claude Code:

- wrote most of the source code: the data parsers for each live feed, the threat-level and "could this reach you"
  logic, the plain-language sentences, the map and the interface, the desktop app (Electron) and the Android app (Capacitor);
- wrote the unit tests, the ESLint configuration and the build scripts;
- reorganised the code into modules and improved its quality when asked;
- drafted the safety tips from public preparedness advice (see [CREDITS.md](CREDITS.md));
- drafted the README, CREDITS.md and this file.

## What the student did

- Came up with the idea: an installable app that shows live natural disasters on a world map and tells each person
  which ones could affect them and what to do.
- Set the requirements: Windows, macOS and Android; no server of their own; every piece of disaster information
  must be live and never written into the app; automatic location; notifications and a short daily brief;
  plain-language sentences instead of symbols; clicking an event zooms the map and opens its details.
- Directed the design through testing and feedback, for example: making the screen less crowded and easier to read,
  switching to a normal light map, adding smooth hover effects and tooltips, adding pictures of events, adding tips
  for disasters that could reach the user, and adding a window showing where all the information comes from.
- Tested the app and decided what to change.

## How the work was checked

- Each change was tried in the running app (the Windows desktop app and the browser preview).
- Each change was checked with `npm run check`: ESLint, 26 offline unit tests and a full build.

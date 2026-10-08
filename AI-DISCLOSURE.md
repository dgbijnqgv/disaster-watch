# AI Disclosure

The Congressional App Challenge allows AI tools as long as all AI use is fully disclosed. This file describes that use.

> **Student: read every line of this file, correct anything that is not accurate, and fill in the parts marked
> _[student]_ before submitting.** It must describe what actually happened.

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
- _[student]_ Code you wrote or changed yourself, with file names:
  - …
- _[student]_ Anything else you did (research, design sketches, testing on devices, the demo video): …

## How the student checked the AI's work

- Ran the app on _[student: Windows / Android phone / …]_ and tested each feature.
- Ran `npm run check` (lint, 26 unit tests and the build) after changes.
- _[student]_ Read and can explain: …

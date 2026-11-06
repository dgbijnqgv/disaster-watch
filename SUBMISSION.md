# Congressional App Challenge 2026: submission checklist

Official rules: <https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf>

**Deadline: 12:00 pm EDT, Monday, October 26, 2026.** The submission cannot be changed afterwards.

## 1. Eligibility (check before anything else)

- [ ] You are in middle or high school on October 26, 2026.
- [ ] Your district (where you live or go to school) is taking part: <https://www.congressionalappchallenge.us/students/>.
- [ ] Solo, or a team of up to 4 where at least half live or go to school in that district.
- [ ] This is your only entry this year.
- [x] The app was made after October 30, 2025 (work started September 2026).

## 2. Originality and AI use (the rules that matter most for this project)

The rules say all coding must be done by the student, AI may be used only if fully disclosed, AI "must not constitute
the entirety of the technical development", and you must show significant personal contribution and understanding.
Judges may ask for the source code and question you about it.

- [ ] Check that [AI-DISCLOSURE.md](AI-DISCLOSURE.md) is accurate and add anything you built yourself; paste its content (or a summary and a link) into the
      submission form wherever it asks about tools or AI.
- [ ] Build part of the app yourself before the deadline (ideas in section 6) and list it in AI-DISCLOSURE.md.
- [ ] Learn how the code works well enough to explain it. Start with the "Code" section of the [README](README.md),
      then read `src/core/brief.js` (who is affected and the daily brief) and `src/core/sources.js` (the live feeds).
- [x] Open-source libraries and tools are documented in [CREDITS.md](CREDITS.md) and inside the app.

## 3. Registration (at congressionalappchallenge.us)

You need: a personal (not school) email; home and school addresses with 9-digit ZIP code, Congressional District and
Member of Congress; a parent or guardian's name and email; optionally a teacher or mentor's name and email.
Teams: one person creates the team profile and invites the others. Everyone completes the eligibility quiz.

## 4. Demo video (1 to 3 minutes, public on YouTube or Vimeo)

The rules require every item marked *required*. Suggested order and timing (about 2½ minutes):

| Time | What to say or show |
|---|---|
| 0:00–0:15 | *Required:* your name(s) and the app's name. |
| 0:15–0:30 | *Required:* its purpose in one sentence, e.g. the line in **Settings → About**. *Required:* who it is for. |
| 0:30–1:00 | Open the app: the brief at the top says whether anything near you needs attention. Show the map, hover a marker, click it: the map zooms and the details open with a satellite picture. |
| 1:00–1:30 | Show what happens when a disaster could reach you: the "What to do" card in **Near me**, the steps and the red warning. (Set your location near a live event in Settings → Pick on map.) |
| 1:30–1:50 | Notifications and the daily brief (Settings → Send a test notification); it keeps watching in the background. |
| 1:50–2:10 | **Sources** window: everything is live from USGS, GDACS, NASA and the National Weather Service. |
| 2:10–2:30 | *Required:* tools and languages: JavaScript, HTML and CSS; Leaflet, Electron and Capacitor; Claude Code as an AI assistant (be open about it). |

Record the screen with the Windows Snipping Tool (Record) or Xbox Game Bar (Win+G). Set the video to **Public**.

## 5. Written questions

Answer these in your own words; the judges want to hear you. Notes below are facts about the project to help you
remember, not answers.

1. **Title:** Disaster Watch.
2. **Purpose:** see Settings → About.
3. **Inspiration:** _your own reason._
4. **A technical difficulty and how it was solved.** Real problems this project had to solve:
   - The same storm or fire is reported by both GDACS and NASA EONET; they are matched by type and distance (storms also by name)
     and merged so it is not shown twice (`mergeGdacsEonet` in `src/core/sources.js`).
   - Deciding whether a disaster can reach someone: each hazard has an impact radius that grows with its strength,
     for example earthquake magnitude or storm wind speed (`impactRadiusKm` in `src/core/hazards.js`).
   - Sending alerts while the app is closed works differently on desktop (a background process in Electron) and on
     Android (a background task that only allows one script and lacks some browser features).
   - Never showing "all clear" when the data could not be loaded: each source is checked separately and the brief
     says when some did not respond.
5. **What you learned:** _your own answer._
6. **A 2.0 version:** ideas: more languages; miles as well as kilometres; a family check-in feature; an iPhone app;
   a paid map provider so the app can handle many users (see "Before public release" in the README).

## 6. Ideas for your own contribution

Each can be done in a few days and touches a small part of the code. Write it yourself; ask for explanations, not code.

- **Miles or kilometres setting.** Add a select in Settings (`src/index.html`, `src/ui/settings.js`), save it in
  `state.settings` (`src/ui/state.js`) and use it where distances are written (`where` in `src/core/text.js`).
- **Share an event.** A button in the detail view (`src/ui/detail.js`) that copies a sentence about the event and its
  official link, using `navigator.clipboard.writeText`.
- **Emergency contacts.** A small list in the Prepare tab where people save names and phone numbers, stored like the
  go-bag checklist (`src/ui/prepare.js`).
- **"Last 24 hours" filter** for the World list (`src/ui/lists.js`, `passesFilters` in `src/ui/state.js`).
- **Tests for your feature** in `test/`, run with `npm test`.

After any change, run `npm run check`.

## 7. Sharing the source code

Judges may ask for the app and its source. The code is in the private GitHub repository
<https://github.com/dgbijnqgv/disaster-watch>. To share it, either make the repository public (Settings → General →
Danger Zone → Change visibility) or add the judge as a collaborator (Settings → Collaborators). The Windows installer is
`release/Disaster Watch Setup 1.0.0.exe` after `npm run dist:win`.

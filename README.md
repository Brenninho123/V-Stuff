# V Stuff

Convert Friday Night Funkin' content between **Psych Engine** and **V-Slice** formats, entirely in your browser. No install, no backend, no build step — open `index.html` and go.

**[Live site](#) · Installable as an app (PWA)**

## What it converts

The site is split into a direction switcher — **Psych → V-Slice** and **V-Slice → Psych** — each with three tabs:

| Tab | Psych → V-Slice | V-Slice → Psych |
|---|---|---|
| **Charts** | Note data, section/BPM structure, and events (`Play Animation`, camera zoom, flash, and more) | Same, in reverse — rebuilds Psych's 4-beat sections from `timeChanges`, picks `mustHitSection` by majority vote per section |
| **Characters** | Animations, offsets, scale, sing time, health icon, death states | Same fields back to Psych's character schema |
| **Stages** | Position/camera data plus a regex-based parser that pulls background props out of the stage's Lua script | Generates both a `stage.json` **and** the Lua `onCreate()` needed to recreate the props |

Every conversion includes an explanation panel describing exactly what mapped cleanly, what's a best-effort guess, and what simply has no equivalent in the other format — nothing is silently dropped. Where a value can't be represented in the target format at all, it's preserved as raw JSON in an event or field, flagged in the notes, so you can wire it up by hand instead of losing it.

## Why it exists

Psych Engine and V-Slice use fairly different schemas for the same underlying game data — different field names, different conventions for which character is which, different note-direction math. Hand-converting a chart, character, or stage between them is tedious and error-prone. This tool automates the parts that convert cleanly and is upfront about the parts that don't.

## Notes on how it works

- **Everything runs client-side.** Paste or upload a file, get the converted JSON (and Lua, for stages) back immediately — nothing leaves your browser.
- **Lua parsing is regex-based, not a real interpreter.** It picks up the common sprite/animation calls (`makeLuaSprite`, `addAnimationByPrefix`, `addAnimationByIndices`, `setScrollFactor`, `addLuaSprite`, `setObjectOrder`) but won't follow loops, variables used as sprite names, or anything built programmatically. Always sanity-check the generated Lua against your original script.
- **Round-trips are exact where the schema allows it.** Converting a chart forward and then back (or vice versa) reconstructs the same note data and `mustHitSection` flags — this has been verified against real chart files, not just assumed.
- **Schema knowledge comes from real files.** Field names and conventions (like V-Slice's role-based `opponent`/`player`/`girlfriend` naming, or the difference between `frameIndices` and a plain frame count) were confirmed against actual Psych and V-Slice exports rather than guessed, and corrected whenever a new example revealed something the previous pass got wrong.

## Installing as an app

The site ships with a manifest and service worker, so it can be installed like a native app (desktop or mobile) and used offline once installed. On browsers that support it, an **Install app** button appears in the header.

## Tech

Single HTML file (`index.html`) with vanilla JS — no framework, no build step, no dependencies. `manifest.json` and `sw.js` sit alongside it for installability and offline caching. All files need to stay in the same folder, since the paths between them are relative.

## License

Apache-2.0

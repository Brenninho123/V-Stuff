# V Stuff

Convert Friday Night Funkin' content between **Psych Engine**, **V-Slice**, and **Codename Engine**, entirely in your browser — plus an in-browser chart/character/stage/week editor and a community showcase. No install, no backend for the converters, no build step.

**[Live site](#) · Installable as an app (PWA)**

## The three areas

The site has three top-level tabs: **Generator**, **Editor**, and **Online**.

### Generator — convert between engines

Pick an engine on each side with the **Convert from / Convert to** picker (V-Slice, Psych, Codename), then use whichever of the five tabs applies: **Charts**, **Characters**, **Stages**, **Mod Folder**, **Weeks**.

Not every combination is built yet:

| From ↓ / To → | V-Slice | Psych | Codename |
|---|---|---|---|
| **V-Slice** | — | Charts · Characters · Stages · Mod Folder · Weeks | not built |
| **Psych** | Charts · Characters · Stages · Mod Folder · Weeks | — | not built |
| **Codename** | Charts · Characters · Stages | Charts · Characters · Stages | — |

Picking an unbuilt combination shows a plain "not built yet" page instead of guessing — nothing pretends to work when it doesn't.

Every conversion includes an explanation panel describing exactly what mapped cleanly, what's a best-effort guess, and what has no equivalent in the target format at all. Where a value can't be represented, it's preserved as raw JSON in a field or event instead of being silently dropped.

**Mod Folder** converts a whole Psych mod (as a `.zip`) in one pass — characters, stages, songs, weeks (→ V-Slice levels), and audio/image assets — and hands back a report of what converted automatically versus what needs a manual look, plus a ready-to-use output `.zip`.

### Editor — build and preview by hand

Four tools, independent of the converters above:

- **Chart Editor** — a clickable/drag note grid for V-Slice-format charts, with audio playback (plus an optional loudness-normalizing compressor), undo, live zoom, and read-only event markers for reference.
- **Character Editor** and **Stage Editor** — upload a spritesheet PNG and/or its atlas (Sparrow XML or TexturePacker JSON — either works alone) to preview animations frame by frame, then insert the detected animations straight into a character or stage `.json`.
- **Week Editor** — build a V-Slice `level.json` from form fields (name, title asset, background, visibility, song list) instead of hand-editing JSON, with an import option for existing levels.

### Online — community showcase

A lightweight project board with **no custom backend**: posts are public GitHub issues on this repo tagged `showcase`, read through GitHub's public REST API and rendered as cards (search, sort by newest/oldest/most-liked/most-commented, pagination). "Submit your project" opens a pre-filled GitHub issue — posting still requires a GitHub account, since a static site has nowhere safe to hold a token that could post on someone's behalf.

## Options

The gear icon in the header opens:

- **Theme** — light/dark toggle, persisted locally.
- **Language** — English or Portuguese for the site's navigation and chrome. The dense per-tab technical explanations (schema mapping notes) stay English-only on purpose — mistranslating a field name would be worse than not translating it.
- **Account** — optional Google sign-in, purely decorative (shows your name/photo locally, no server ever sees the token).
- **Profile** — an optional local display name and a toggle for whether it's included when you submit a project to Online.

## Setup needed before deploying

A few things only work once you provide them — the site degrades gracefully without any of them, it just won't show the extra polish:

- **Logo images** — `ui/funkin.png`, `ui/psych.png`, `ui/cne.png` for the three engine buttons in the Generator picker. Falls back to plain text per engine if a file is missing.
- **Google Sign-In** — create an OAuth Client ID at [Google Cloud Console](https://console.cloud.google.com/apis/credentials) for your real domain and paste it into `login.js`'s `GOOGLE_CLIENT_ID`. Until then, Options shows an "isn't set up yet" hint.
- **`showcase` label** — create this label on the GitHub repo (Settings → Labels) so the Online tab has something to filter on.

## Notes on how it works

- **The converters run entirely client-side.** Paste or upload a file, get the result back immediately — nothing leaves your browser. The Mod Folder tool works the same way, using JSZip in-browser.
- **Lua parsing is regex-based, not a real interpreter.** It picks up the common sprite/animation calls (`makeLuaSprite`, `addAnimationByPrefix`, `addAnimationByIndices`, `setScrollFactor`, `addLuaSprite`, `setObjectOrder`) but won't follow loops, variables used as sprite names, or anything built programmatically. Always sanity-check generated Lua against the original script.
- **Schema knowledge comes from real files**, not guesses — field names and conventions across all three engines were confirmed against actual exports and corrected whenever a new example revealed something a previous pass got wrong. Where a mapping is a best-effort inference rather than a confirmed fact (like Codename's undocumented event params, or Lua-derived z-ordering), the notes panel says so.
- **Round-trips are exact where the schema allows it** — converting a chart forward and back reconstructs the same note data, verified against real chart files rather than assumed.
- **The Online tab has no server of its own.** It reads GitHub's public API directly from your browser, which means it's subject to GitHub's unauthenticated rate limit (60 requests/hour per IP) — expect an occasional "couldn't load right now, browse on GitHub directly" message under heavy use.

## Installing as an app

The site ships with a manifest and service worker for offline installability. On supported browsers, an **Install app** button appears in the header.

## Tech

`index.html` (all HTML/CSS/JS for the converters, editors, and UI) plus two small standalone scripts it loads: `network.js` (Online tab) and `login.js` (optional Google sign-in). All three need to ship together, along with `manifest.json`, `sw.js`, the icon set, and the three engine logo images. No framework, no build step — everything is vanilla JS plus JSZip (loaded from a CDN) for the Mod Folder tool.

## License

Apache-2.0

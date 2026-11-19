# CLAUDE.md

Cheat Index is a fan reference site listing the official in-game cheat codes from Rockstar games, from GTA (1997) to GTA VI. It's a static site on GitHub Pages: plain HTML, CSS and JavaScript with JSON data. There's no framework, no build step and no dependencies.

The owner is MercuryHQ (GitHub: NBDBatman). British English in all copy.

## Layout

```
index.html          Home: hero + search, selected-game panel, cover grid, input-type legend
game.html           Game page: game.html?g=<slug>&p=<input id>. Old game.html#<slug>[/<input id>] links still work
assets/style.css    All styles. Theme tokens are CSS variables on [data-theme]
assets/theme.js     Runs in <head> before paint. Dark is the default, saved in localStorage 'ci-theme'
assets/common.js    window.CI: el(), getJSON(), renderCombo(), comboWords(), cover(), countText(), copy(), stars...
                    Also registers sw.js
assets/home.js      Grid, sort, platform filter, search (titles, then every cheat once loaded)
assets/game.js      Cheat list, platform switch, filter, category tabs, stars, copy, report links, print, states
data/games.json     Index of games. `count` must equal the length of that game's cheats array
data/<slug>.json    One file per game
covers/<slug>.jpg   Cover art, 600x800. The site shows a labelled slot when the file is missing
sw.js               Service worker for offline use. Network first for pages and data, cache first for covers and fonts
sitemap.xml         Home plus game.html?g=<slug> for every game. Add new games here
404.html            GitHub Pages' not-found page. Uses absolute /Rockstar-Cheat-Index/ paths, as it's shown at any depth
manifest.webmanifest  App install. Icons: assets/icon.svg (favicon), icon-192/512.png, apple-touch-icon.png; og.png is the 1200x630 link preview
.github/            check_data.py (data checks), workflows/check-data.yml (runs it on every push), ISSUE_TEMPLATE/
DESIGN.md           Design decisions and reasons. Read it before any visual change
LICENSE             MIT, Copyright (c) 2026 MercuryHQ/NBDBatman
```

Slugs: `gta`, `gta-london`, `gta-2`, `gta-iii`, `gta-vc`, `gta-sa`, `warriors`, `gta-lcs`, `bully`, `gta-vcs`, `gta-iv`, `gta-ctw`, `rdr`, `gta-v`, `rdr2`, `gta-vi`.

## Commands

- Run locally: `python3 -m http.server 8000`, then open http://localhost:8000. Opening the HTML file directly fails because the pages `fetch` their JSON.
- Check data: `python3 .github/check_data.py` from the repo root. It checks JSON, counts, `consoles`/`platforms` matching games.json, input ids, combo button names, tbd/incomplete, em dashes, covers at 600x800 and the sitemap. GitHub runs it on every push and pull request, so keep it passing.
- Deploy: push to `main`. GitHub Pages serves from the root at https://nbdbatman.github.io/Rockstar-Cheat-Index/. `.nojekyll` must stay.

## Data format

Each game file has `slug, title, short, year, order, platforms, consoles, methods, inputs, warning, sources, cheats`, plus optional `pending` (no confirmed cheats) and `incomplete` (list known to be partial).

- `platforms` is the broad family (`PC`, `PlayStation`, `Xbox`, `Switch`, `Handheld`) and drives the home-page filter.
- `consoles` is the exact machines the listed codes work on (`PS2`, `Xbox Series X/S`, ...) and is what the site shows. Keep it the same in `games.json` and the game's own file, and in step with the README's games table.

`inputs` defines the platform switch. Each input has `id, label, type, how`:
- `type` is `text`, `combo`, `phone` or `phrase`.
- Combos also have `pad`: `ps`, `xbox`, `xbox360`, `xboxog`, `switch` or `ds`.
- `derive: "ps"` makes Xbox and Switch combos from the PlayStation ones.
- Input ids are shared across games so the remembered platform (localStorage `ci-plat`) carries over. `ps` and `ps2` count as the same pick.

Each cheat looks like:

```json
{ "effect": "...", "category": "Player", "codes": { "pc": "...", "ps": "..." }, "requirement": "...", "note": "..." }
```

- `codes` keys match input ids: `pc ps ps2 psp ds phone phrase mobile xboxog` (`xbox`, `xbox360` and `switch` are derived, never written). A cheat with no key for the selected platform is hidden from that platform's list, so a cheat named differently in another version can have its own entry without looking like a duplicate.
- `"tbd": true` with empty `codes` marks a cheat confirmed to exist whose code hasn't been found yet. It shows on every platform with "TBD" and no Copy button, and counts towards `count`. When the code is found, add it to `codes` and remove `tbd`.
- Write combos with PlayStation names, space-separated: `Cross Circle Square Triangle L1 R1 L2 R2 Up Down Left Right`. Use `L`/`R` for PSP shoulders, and `A B X Y L R` for DS. Prefix with `HOLD:L1 ` when a button is held.
- Xbox is mapped in common.js: Cross→A, Circle→B, Square→X, Triangle→Y, L1→LB, R1→RB, L2→LT, R2→RT. This is only valid for Xbox 360 and later.
- San Andreas only: `xbox360` (2014 port) swaps bumpers and triggers: L1→LT, L2→LB, R1→RT, R2→RB. `xboxog` (2005 original Xbox) is L1→L trigger, R1→R trigger, L2→White, R2→Black. The `xboxog` input isn't derived: each cheat has its own `xboxog` code, written with PlayStation names, and only where iGrandTheftAuto's Xbox list matched. Some original Xbox sequences differ from PS2, so don't derive it.
- `"not": ["xbox", "switch"]` hides a cheat on those tabs even when the input is derived. Used for cheats removed from the Definitive Edition, on tabs that only cover the Definitive Edition.
- Switch (Definitive Edition only) keeps button positions: Cross→B, Circle→A, Square→Y, Triangle→X, L1→L, R1→R, L2→ZL, R2→ZR. Checked against Nintendo Wire's lists for all three games.
- `risk` is a side effect that can harm a save, crash the game or block a mission. It shows as a "Careful:" line in the warning colour. Needs two sources that describe the same effect; skip minor glitches.
- `checked` (game files only, `YYYY-MM-DD`) is the day the game's codes were last checked against sources. Update it whenever you re-check, never otherwise. The data check requires it.
- `requirement` is something the player must have or do first: a newspaper unlock, a specific edition, phone only. `note` is anything else, like an alternate code.
- Categories in use: Player, Weapons, Money, Wanted, Vehicles, World, Pedestrians, Score, Levels, Other.

## Rules for cheat data

- Only official in-game cheats. No mods, trainers, GameShark or CWCheat codes.
- Copy codes exactly from the source. Write effect descriptions in your own words, in sentence case.
- Every game file lists the sources its codes were checked against in `sources`. Add the URL when you add codes from a new source. Sources are kept in the data for checking, but the owner chose not to show them on the site, so don't add a sources list back to the game page.
- Never invent a code, phone number, phrase, requirement or cheat count. If it can't be sourced, leave it out. A game marked `pending` shows `TBC`.
- New games and new codes need two sources that give the same code. For a code only one source has, leave it out and say so.
- GTA VI (released 19 November 2026): all 61 cheats are listed, but cheats whose code hasn't been found are marked `tbd`. Fill in a code only when at least two independent sources give the same sequence, and add its URL to `sources`. Keep `incomplete: true` until no `tbd` cheats are left.
- When cheats are added or removed, update `count` in `data/games.json`.
- Every new game needs its cover, `covers/<slug>.jpg` at 600x800, and a `sitemap.xml` entry, in the same change.
- Stars are saved by effect name (localStorage `ci-stars`), so renaming an effect drops anyone's star on it. Rename only when it's worth it.

## Controller practice

On combo tabs, once the browser has seen a gamepad, each cheat gets a Practise button. `CI.padButtons(code, pad)` maps a stored combo to the browser's standard button numbers (0 bottom face button, 4/5 L1/R1, 6/7 L2/R2, 12 to 15 d-pad). Supported pads: `ps`, `xbox`, `switch`, `xbox360` (triggers and bumpers swapped), `ds`. `xboxog` can't be practised, as no modern pad has White/Black. Progress is shown with ink classes `.key.hit` and `.key.next`, never the accent. Escape stops. Keep the Practise button hidden when no pad has been seen.

## Offline cache

`sw.js` serves covers and fonts from its cache once saved. When you replace a cover or change `sw.js`, bump `CACHE` in `sw.js` (`ci-v1` → `ci-v2`) so visitors get the new files. Pages, scripts and data are network first and don't need a bump.

## Design rules (full reasons in DESIGN.md)

- Direction: a printed strategy guide marked up with a highlighter. Dials: ENERGY 1 / RHYTHM 2 / MOTION 1. The owner tried a louder tabloid style and rejected it, so don't drift back.
- Dark by default, with a working light toggle. Both themes must pass.
- Palette: charcoal `#1a1c20`, text `#d9dbd6`, one accent of butter yellow `#e8d77a` (`#efd96a` in light). The accent only goes behind codes and on the one primary button. Selected states use ink and weight, never the accent.
- Fonts: IBM Plex Sans for everything, IBM Plex Mono only for codes, keycaps, years and file paths. No other fonts. No uppercase wide-spaced labels.
- Radius 3px (2px on code highlights). No pill shapes, gradients, glow, glass or emoji icons.
- Motion: hover and pressed states only, off under `prefers-reduced-motion`.
- Copy: no em dashes. Keep "No ads, and there never will be." The footer keeps the unofficial/not-affiliated line and the MIT credit.

## Accessibility and quality bar

- Contrast: text 4.5:1, control borders and focus rings 3:1, in both themes. Check new colour pairs with a contrast tool, don't guess.
- Real `<button>` and `<a href>` elements only. Every control gets an accessible name and a visible focus state, and touch targets are at least 44px.
- No sideways scroll at 375px wide. Cheat rows stack under 640px, and the platform switch goes 2×2 under 420px.
- Every data view keeps its loading, error (with Try again) and empty states.
- `<img>` elements need `width`/`height`. Grid covers are lazy-loaded; the selected-game cover is not, and gets `fetchpriority="high"`.

## Don't

- Don't add ads, analytics, trackers or third-party scripts. Google Fonts is the only external request.
- Covers are the official front-of-box art, taken from Rockstar's own site where possible (their 640px box images, or a game's downloads page), cropped to 600x800. Rockstar logos and game fonts may appear inside a cover, but never in the site's own interface, and don't add anything else that makes the site look official.
- Don't add a framework or build step unless the owner asks.
- Repo: https://github.com/NBDBatman/Rockstar-Cheat-Index. Corrections go to its Issues; keep those links in the footer and on game pages.

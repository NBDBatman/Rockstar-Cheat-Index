# CLAUDE.md

Cheat Index is a fan reference site listing the official in-game cheat codes from Rockstar games, from GTA (1997) to GTA VI. It's a static site on GitHub Pages: plain HTML, CSS and JavaScript with JSON data. There's no framework, no build step and no dependencies.

The owner is MercuryHQ (GitHub: NBDBatman). British English in all copy.

## Layout

```
index.html          Home: hero + search, selected-game panel, cover grid, input-type legend
game.html           Game page, routed by hash: game.html#<slug> (?g=<slug> also works)
assets/style.css    All styles. Theme tokens are CSS variables on [data-theme]
assets/theme.js     Runs in <head> before paint. Dark is the default, saved in localStorage 'ci-theme'
assets/common.js    window.CI: el(), getJSON(), renderCombo(), comboWords(), cover(), countText()
assets/home.js      Grid, sort, platform filter, search (titles, then every cheat once loaded)
assets/game.js      Cheat list, platform switch, category tabs, copy, loading/error/empty states
data/games.json     Index of games. `count` must equal the length of that game's cheats array
data/<slug>.json    One file per game
covers/<slug>.jpg   Cover art, 600x800. The site shows a labelled slot when the file is missing
DESIGN.md           Design decisions and reasons. Read it before any visual change
LICENSE             MIT, Copyright (c) 2026 MercuryHQ/NBDBatman
```

Slugs: `gta`, `gta-2`, `gta-iii`, `gta-vc`, `gta-sa`, `gta-lcs`, `bully`, `gta-vcs`, `gta-iv`, `gta-ctw`, `rdr`, `gta-v`, `rdr2`, `gta-vi`.

## Commands

- Run locally: `python3 -m http.server 8000`, then open http://localhost:8000. Opening the HTML file directly fails because the pages `fetch` their JSON.
- Validate data: `python3 -c "import json,glob; [json.load(open(f)) for f in glob.glob('data/*.json')]"`
- Deploy: push to `main`. GitHub Pages serves from the root at https://nbdbatman.github.io/Rockstar-Cheat-Index/. `.nojekyll` must stay.

## Data format

Each game file has `slug, title, short, year, order, platforms, methods, inputs, warning, sources, cheats`, plus optional `pending` (no confirmed cheats) and `incomplete` (list known to be partial).

`inputs` defines the platform switch. Each input has `id, label, type, how`:
- `type` is `text`, `combo`, `phone` or `phrase`.
- Combos also have `pad`: `ps`, `xbox` or `ds`.
- `derive: "ps"` makes Xbox combos from the PlayStation ones.

Each cheat looks like:

```json
{ "effect": "...", "category": "Player", "codes": { "pc": "...", "ps": "..." }, "requirement": "...", "note": "..." }
```

- `codes` keys match input ids: `pc ps ps2 psp ds phone phrase mobile`. A missing key renders as "Not on <platform>".
- Write combos with PlayStation names, space-separated: `Cross Circle Square Triangle L1 R1 L2 R2 Up Down Left Right`. Use `L`/`R` for PSP shoulders, and `A B X Y L R` for DS. Prefix with `HOLD:L1 ` when a button is held.
- Xbox is mapped in common.js: Cross→A, Circle→B, Square→X, Triangle→Y, L1→LB, R1→RB, L2→LT, R2→RT. This is only valid for Xbox 360 and later.
- `requirement` is something the player must have or do first: a newspaper unlock, a specific edition, phone only. `note` is anything else, like an alternate code.
- Categories in use: Player, Weapons, Money, Wanted, Vehicles, World, Pedestrians, Score, Levels, Other.

## Rules for cheat data

- Only official in-game cheats. No mods, trainers, GameShark or CWCheat codes.
- Copy codes exactly from the source. Write effect descriptions in your own words, in sentence case.
- Every game file lists the sources its codes were checked against in `sources`. Add the URL when you add codes from a new source.
- Never invent a code, phone number, phrase, requirement or cheat count. If it can't be sourced, leave it out. Unknown counts show as `[COUNT]` and GTA VI shows `TBC`.
- GTA VI: add codes only once they're confirmed in the released game. Pre-launch "leaked" lists were guesses.
- When cheats are added or removed, update `count` in `data/games.json`.
- Every new game needs its cover, `covers/<slug>.jpg` at 600x800, in the same change.

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

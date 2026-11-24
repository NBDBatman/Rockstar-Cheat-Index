# Cheat Index: design direction

Design read: a reference site for players who want one code fast, styled as a printed strategy guide marked up with a highlighter. Dials: ENERGY 1 / RHYTHM 2 / MOTION 1.

The owner tried a louder tabloid direction and preferred this one, so keep it.

## Why each choice

- **Dark by default, with a light toggle:** the owner asked for dark. People often look codes up mid-session next to a game, so dark is easier on the eyes. Light mode exists for daylight reading.
- **Charcoal ground, not black** (`#1a1c20`, text `#d9dbd6`): pure black with white text was too harsh.
- **One accent, butter yellow** (`#e8d77a` dark, `#efd96a` light): a highlighter on the codes you need. It appears in only two places, behind codes and on the one primary button. Selection uses ink and weight, never the accent.
- **Control borders** `#767b82` dark, `#80848a` light: these give 3:1 or better against the page so inputs and buttons are visible.
- **IBM Plex Sans + IBM Plex Mono:** one family, so they never clash. Mono is only for things you type or read character by character: codes, keycaps, years, file paths. Labels are sentence case in Plex Sans.
- **Radius 3px**, 2px on code highlights. No pills, so it feels printed rather than app-like.
- **Motion:** hover and pressed states only. The 1px press nudge is off under `prefers-reduced-motion`.
- **Stars** are outline icons in the muted ink, filled with ink when on. Never the accent, because starring is a selected state.
- **Linked cheat:** a cheat opened from a link gets a 3px ink bar down its left edge, like a pen mark in the margin. Ink, not the accent.
- **App icon and logo:** a charcoal page with three lines, the middle one highlighted in butter yellow. The same drawing is the favicon (`assets/icon.svg`), the app icons and the header logo, inlined beside the name at 32px on every page. No text, no game art, nothing that looks like Rockstar's branding. The link preview image uses the same type and colours as the site.
- **Careful lines** (cheat risks) use the warning colour with a bold "Careful:", the same as game-level warnings. They're reserved for real harm: lost saves, crashes, missions that can't be finished.
- **Practice mode** marks hit keys by inverting them to ink and rings the next key in ink. No accent, no animation beyond the state change, so it stays calm and works under reduced motion.
- **Report links** are small muted text under Copy, so they're there when needed without competing with the code.
- **Print** drops the header, footer, controls, cover and Copy column, and keeps the highlight behind codes. It's meant to look like a page torn from the guide.

## Layout

- Home: search, then the selected game, then the cover grid (newest first), then the input-type legend. The grid is `minmax(140px, 1fr)`, so two columns on a phone.
- Game page: platform switch and how-to first, then the cheat table. At 640px and below the table rows stack (effect and Copy, category, then the code).
- Side padding `clamp(16px, 4vw, 32px)`; H1 `clamp(32px, 3.4vw + 14px, 48px)`.

## Data and states

- Each game is one JSON file. The cheat count is the array length, never typed by hand. Unwritten games show `[COUNT]` and `[EXAMPLE CODE]`. A game marked `pending` shows TBC until codes are confirmed.
- The cheat list needs loading, error (with Try again) and no-confirmed-cheats states. See the "Cheat list states" artboard.
- Don't claim codes were tested unless they were.

## Cover art

- Files are `covers/<slug>.jpg`, 600×800 (3:4).
- Every `<img>` gets `width` and `height`. Lazy-load the grid covers. The selected-game cover is above the fold, so give it `fetchpriority="high"` and don't lazy-load it.
- The box art belongs to its publishers. The footer says so.

## Copy rules

- No em dashes. No ads, ever, and the site says so.
- Corrections link to the GitHub repo's Issues page.

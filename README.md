# Cheat Index

A fan reference for every official cheat code Rockstar built into their games, from Grand Theft Auto (1997) to Red Dead Redemption 2. It lists PC, PlayStation, Xbox and handheld codes. No ads, ever.

It's a plain static site with no build step, made for GitHub Pages.

## What's in here

```
index.html          Home: search, sort, platform filter, game grid
game.html           One page for every game: game.html#<slug>
assets/             style.css, theme.js, common.js, home.js, game.js
data/games.json     The game list (title, year, platforms, input types, cheat count)
data/<slug>.json    One file per game with every cheat
covers/             Cover art goes here (see below)
DESIGN.md           Design decisions and the reasons for them
LICENSE             MIT
```

## Run it locally

The pages load their data with `fetch`, so opening the HTML file directly won't work. Serve the folder instead:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Put it on GitHub Pages

1. Push this folder to a repository, with `index.html` at the root.
2. In the repo, go to Settings, then Pages, and choose "Deploy from a branch", your main branch, `/ (root)`.
3. The site goes live at https://nbdbatman.github.io/Rockstar-Cheat-Index/.

`.nojekyll` is included so GitHub serves every file as-is.

## Cover art

The site doesn't ship any box art. Add your own images as `covers/<slug>.jpg`, at 600×800 (3:4). A cover appears automatically once its file exists, and until then the site shows a labelled slot. The slugs are:

`gta`, `gta-2`, `gta-iii`, `gta-vc`, `gta-sa`, `gta-lcs`, `bully`, `gta-vcs`, `gta-iv`, `gta-ctw`, `rdr`, `gta-v`, `rdr2`, `gta-vi`

Box art belongs to its publishers, so use images you're allowed to use.

## Adding or fixing cheats

Spotted a wrong code? Open an issue at https://github.com/NBDBatman/Rockstar-Cheat-Index/issues, or send a pull request.


Edit the game's file in `data/`. Each cheat looks like this:

```json
{
  "effect": "Invincibility for five minutes",
  "category": "Player",
  "codes": {
    "pc": "PAINKILLER",
    "ps": "Right Cross Right Left Right R1 Right Left Cross Triangle",
    "phone": "1-999-724-654-5537"
  },
  "requirement": "Optional. Anything you must have or do first, like a newspaper unlock or a specific edition.",
  "note": "Optional. Anything else worth knowing, like an alternate code."
}
```

- The keys in `codes` match the `inputs` listed at the top of that game's file (`pc`, `ps`, `ps2`, `psp`, `ds`, `phone`, `phrase`, `mobile`).
- Write button combos with PlayStation names: `Cross Circle Square Triangle L1 R1 L2 R2 Up Down Left Right`. Xbox combos are generated from these for GTA III, Vice City, San Andreas and GTA V. Start a combo with `HOLD:L1 ` if a button has to be held down.
- When you add or remove a cheat, update that game's `count` in `data/games.json` to match.
- Only add codes that work in the game. Each game file lists the sources its codes were checked against.

## Licence

The site's code and data files are under the MIT License (see `LICENSE`), © 2026 MercuryHQ/NBDBatman.

This is an unofficial fan project. It isn't affiliated with or endorsed by Rockstar Games or Take-Two Interactive. Game titles and cover art belong to their owners.

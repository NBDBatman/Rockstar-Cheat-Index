# Cheat Index

**Every official cheat code Rockstar shipped in their games, in one place.**

From Grand Theft Auto (1997) to GTA VI: PC codes, PlayStation and Xbox button combos, handheld codes, phone numbers and Red Dead phrases. Pick a game, pick your platform, copy the code.

**[Open Cheat Index](https://nbdbatman.github.io/Rockstar-Cheat-Index/)**

No ads, and there never will be.

---

## Why it exists

Most cheat lists are buried under autoplay video, pop-ups and five paragraphs of filler before the first code. They mix in mod and trainer codes, and they rarely say which platform a combo is for.

Cheat Index is the opposite. It only lists codes that are built into the games, each one checked against its sources, and the code you need is one tap from the top of the page.

## What you get

- **Every cheat in 16 games**, including all 61 in GTA VI. GTA VI codes that players haven't found yet are marked TBD and filled in as they're discovered.
- **A platform switch on every game.** Codes for PC, PlayStation, Xbox, Switch, PSP, DS, mobile, phone and phrase entry each get their own view, so you only see what works on your machine. The site remembers your platform for the next game.
- **Button combos drawn as buttons.** PlayStation shows ✕ ○ □ △, Xbox shows A B X Y, Switch shows B A Y X and ZL ZR, and held buttons are called out.
- **One-tap copy.** Combos copy as readable words ("Hold L1, then R2, Cross…"), and typed codes copy exactly.
- **Search across every game at once,** by effect ("tank"), by code ("HESOYAM") or by game. Each game page also has its own filter.
- **Star the cheats you use.** Starred cheats get their own tab, saved in your browser.
- **Share a platform or a single cheat.** Links like `game.html?g=gta-sa&p=xbox` open on that platform's codes. Click a cheat's name to link straight to it.
- **Print a code sheet.** Print gives a plain page of what's on screen: the whole list, a filter, or just your starred cheats.
- **Works offline, and installs like an app.** After your first visit, every game's cheats open with no connection. Add it to your home screen to keep it a tap away.
- **Press `/` to search** from anywhere, or to filter on a game page.
- **Report a code from the code itself.** Each cheat has a Report link that opens a GitHub issue with the game, platform and cheat filled in.
- **Requirements and warnings up front.** Each page notes newspaper unlocks, edition-specific codes, and whether cheats turn off achievements or saving.
- **Dark by default, with a light mode.** It works on a phone, with a keyboard and with a screen reader.

## Games covered

| Game | Year | How cheats are entered | Codes listed for | Cheats |
| --- | --- | --- | --- | --- |
| Grand Theft Auto | 1997 | Typed | PC, PS1 | 28 |
| GTA: London 1969 | 1999 | Typed | PC, PS1 | 22 |
| Grand Theft Auto 2 | 1999 | Typed | PC, PS1 | 46 |
| Grand Theft Auto III | 2001 | Combo, typed | PC, PS2, PS4, PS5, Switch, Xbox One, Xbox Series X/S, mobile | 25 |
| GTA: Vice City | 2002 | Combo, typed | PC, PS2, PS4, PS5, Switch, Xbox One, Xbox Series X/S, mobile | 59 |
| GTA: San Andreas | 2004 | Combo, typed | PC, PS2, PS3, PS4, PS5, Switch, original Xbox, Xbox 360, Xbox One, Xbox Series X/S, mobile | 88 |
| The Warriors | 2005 | Combo | PS2 | 11 |
| GTA: Liberty City Stories | 2005 | Combo | PSP, PS2 | 43 |
| Bully | 2006 | Combo | PS2 | 8 |
| GTA: Vice City Stories | 2006 | Combo | PSP, PS2 | 36 |
| Grand Theft Auto IV | 2008 | Phone | PC, PS3, Xbox 360 | 16 |
| GTA: Chinatown Wars | 2009 | Combo, typed | DS, PSP, mobile | 21 |
| Red Dead Redemption | 2010 | Phrase | PC, PS3, PS4, Switch, Xbox 360 | 21 |
| Grand Theft Auto V | 2013 | Combo, typed, phone | PC, PS3, PS4, PS5, Xbox 360, Xbox One, Xbox Series X/S | 36 |
| Red Dead Redemption 2 | 2018 | Phrase | PC, PS4, Xbox One | 37 |
| Grand Theft Auto VI | 2026 | Combo | PS5, Xbox Series X/S | 61 (43 codes TBD) |

A few things to know about consoles:

- **GTA III, Vice City and San Andreas:** PS4, PS5, Switch, Xbox One, Series X/S and mobile mean the Definitive Edition, which takes the same combos as the PS2 originals. On Switch the buttons keep their positions: ✕ is B, ○ is A, □ is Y, △ is X, L2 and R2 are ZL and ZR. On mobile, type the PC codes with a keyboard. A few cheats were removed from the Definitive Edition; they're marked, and hidden on the Switch and Xbox One/Series tabs.
- **San Andreas on older Xboxes:** the 2014 Xbox 360 release has the bumpers and triggers the other way round, and the 2005 original Xbox used White and Black buttons. Each has its own tab. The original Xbox tab lists the 74 codes confirmed for that version. Original Xbox codes for GTA III and Vice City aren't covered yet.
- **Red Dead Redemption:** the phrases are the same on every version, including the 2023 PS4 and Switch release and the 2024 PC release.
- **GTA V:** button combos work on every console listed, but the phone numbers only work on PS4, PS5, Xbox One, Series X/S and PC.
- **Backward compatibility:** a game played through backward compatibility takes the same codes as the version it's running. For example, RDR2 on PS5 or Xbox Series X/S uses the PS4 and Xbox One codes.

## Found a wrong code?

Use the Report link next to the cheat, or [open an issue](https://github.com/NBDBatman/Rockstar-Cheat-Index/issues/new/choose). The form asks for the game, the platform, the cheat and what happened. A link to where you found the correct code helps a lot. For a GTA VI cheat marked TBD, the link says Send code instead.

You can also fix it yourself. Each game is a single JSON file, so most fixes are a one-line pull request. See [Contributing](#contributing).

## Contributing

### The rules

1. **Official in-game cheats only.** No mods, trainers, GameShark, Action Replay or CWCheat codes.
2. **Copy codes exactly from the source**, and add the source URL to that game's `sources` list if it isn't there yet.
3. **Never guess.** If a code, phone number, phrase or requirement can't be sourced, leave it out.
4. **Write effects in your own words**, in sentence case and British English.
5. **GTA VI codes need two independent sources that agree**, since new codes are still being found. Cheats whose code isn't known yet stay marked `"tbd": true` until then.
6. **Every new game needs a cover picture.** A pull request that adds a game must include `covers/<slug>.jpg` at 600x800 (3:4), using the game's official front-of-box art. Pull requests that add a game without one won't be merged. Add the game's page to `sitemap.xml` as well.

### Editing a game

Each game lives in `data/<slug>.json`. A cheat looks like this:

```json
{
  "effect": "Invincibility for five minutes",
  "category": "Player",
  "codes": {
    "pc": "PAINKILLER",
    "ps": "Right Cross Right Left Right R1 Right Left Cross Triangle",
    "phone": "1-999-724-654-5537"
  },
  "requirement": "Optional. Something the player must have or do first.",
  "note": "Optional. Anything else, like an alternate code."
}
```

- **`codes`** keys match the `inputs` at the top of the file: `pc`, `ps`, `ps2`, `psp`, `ds`, `phone`, `phrase`, `mobile`. Leave a key out and the cheat is hidden on that platform. If two versions use different codes for the same effect, give each version its own entry. A cheat that's missing from one version of a derived tab gets `"not": ["switch"]` (for example), which hides it there.
- **Combos** use PlayStation button names, separated by spaces: `Cross Circle Square Triangle L1 R1 L2 R2 Up Down Left Right`. Use `L` and `R` for PSP shoulders, and `A B X Y L R` for DS. Start with `HOLD:L1 ` when a button is held down.
- **Xbox and Switch combos are generated** from the PlayStation ones, so you don't write them separately.
- **Categories:** Player, Weapons, Money, Wanted, Vehicles, World, Pedestrians, Score, Levels, Other.
- **Counts:** when you add or remove a cheat, update that game's `count` in `data/games.json` to match.
- **Checks:** every push and pull request runs `.github/check_data.py`. It catches invalid JSON, a wrong `count`, mismatched `consoles`, unknown buttons, missing covers and more. You can run it yourself from the repo root before opening a pull request.

### Changing the design

Read [DESIGN.md](DESIGN.md) first. It explains the look (a printed strategy guide with a highlighter pen) and why each choice was made. Changes need to keep both themes at WCAG AA contrast, and keep the site usable at 375px wide and with a keyboard.

## How it's built

Plain HTML, CSS and JavaScript, with the cheats stored as JSON, hosted on GitHub Pages. There's no framework, no build step and no dependencies.

```
index.html          Home: search, game grid, sort and platform filter
game.html           Every game page: game.html?g=gta-sa
assets/             style.css, theme.js, common.js, home.js, game.js
data/games.json     The game list: title, year, platforms, input types, cheat count
data/<slug>.json    One file per game with every cheat and its sources
covers/             Cover art, covers/<slug>.jpg at 600x800
sw.js               Offline support: saves the pages and every game's data
sitemap.xml         Every game page, for search engines
404.html            The page GitHub shows for a broken link
manifest.webmanifest  Lets the site install like an app; icons live in assets/
.github/            Data check, its workflow, and the issue forms
DESIGN.md           Design decisions and the reasons for them
```

Pushing to `main` deploys the site. `.nojekyll` must stay so GitHub serves every file as-is.

Game pages live at `game.html?g=<slug>`, with an optional `&p=<platform>`. The older `game.html#<slug>` links still work.

### Cover art

Covers live in `covers/<slug>.jpg` at 600x800 (3:4), and the site picks them up automatically. Use the official front-of-box art, from Rockstar's own site where possible, cropped to fit. Logos only appear inside the covers, never in the site's own design.

Any new game must come with its cover (see [rule 6](#the-rules)). For the games already listed, a missing cover shows a labelled placeholder until one is added.

Slugs: `gta`, `gta-london`, `gta-2`, `gta-iii`, `gta-vc`, `gta-sa`, `warriors`, `gta-lcs`, `bully`, `gta-vcs`, `gta-iv`, `gta-ctw`, `rdr`, `gta-v`, `rdr2`, `gta-vi`

## Privacy

There are no ads, analytics, trackers or cookies. The only outside request is to Google Fonts for IBM Plex. Your theme, last game, platform and starred cheats are saved in your own browser and never leave it. For offline use, the site keeps a copy of its own pages and data in your browser too.

## Licence

The code and data are released under the [MIT License](LICENSE), © 2026 MercuryHQ/NBDBatman.

Cheat Index is an unofficial fan project. It isn't affiliated with or endorsed by Rockstar Games or Take-Two Interactive. Game titles, cheat codes and cover art belong to their owners. Covers are official box art, shown only to identify each game, and aren't covered by the MIT License.

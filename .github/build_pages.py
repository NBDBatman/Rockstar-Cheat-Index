"""Writes the pages that are made from the data. Run from the repo root: python3 .github/build_pages.py

- games/<slug>/index.html for every game, from .github/game-page.html. Each has its own title,
  description, canonical link, Open Graph tags and Discord embed, because link previews (Discord,
  search engines, chat apps) read the HTML without running the site's JavaScript.
- The Discord embed in index.html, between its BEGIN/END markers.
- sitemap.xml.

Run it after changing anything in data/ or the template, and commit what it writes. The data check
runs the same code and fails if a written file is out of date. Uses only the Python standard library.
"""
import datetime
import html
import json
import os
import re
import urllib.parse

SITE = 'https://nbdbatman.github.io/Rockstar-Cheat-Index/'
REPO = 'https://github.com/NBDBatman/Rockstar-Cheat-Index'
YELLOW = 0xE8D77A  # the site's highlight colour, used as the embed's side strip
EMBED_START = '<!-- BEGIN discord embed: written by .github/build_pages.py -->'
EMBED_END = '<!-- END discord embed -->'


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def page_url(slug):
    return f'{SITE}games/{slug}/'


def md(text):
    """Escape text for Discord markdown, so names like "$250,000" or "*" show as typed."""
    return re.sub(r'([\\*_~`|\[\]<>])', r'\\\1', text)


def btn(label, url):
    return {'type': 2, 'style': 5, 'label': label, 'url': url}


def text(content):
    return {'type': 10, 'content': content}


def platform_list(platforms):
    """Platform families as a phrase: "PC, PlayStation, Xbox and handhelds"."""
    order = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Handheld']
    names = ['handhelds' if p == 'Handheld' else p for p in sorted(set(platforms), key=order.index)]
    return ', '.join(names[:-1]) + ' and ' + names[-1] if len(names) > 1 else names[0]


def game_embed(g):
    """Site logo, the game's title and a one-line description, its cover, then buttons. No codes."""
    url = page_url(g['slug'])
    if g.get('pending'):
        blurb = 'No cheats are confirmed yet. This page fills in once they are.'
    else:
        blurb = (f'Every official cheat code, {len(g["cheats"])} in all, for {platform_list(g["platforms"])}. '
                 'Pick your platform and copy the code.')
    parts = [
        {'type': 9, 'components': [text(f'-# Cheat Index\n# [{md(g["title"])}]({url})\n{md(blurb)}')],
         'accessory': {'type': 11, 'media': {'url': SITE + 'assets/icon-512.png'}, 'description': 'Cheat Index icon'}},
        {'type': 12, 'items': [{'media': {'url': f'{SITE}covers/{g["slug"]}.jpg'}, 'description': f'{g["title"]} cover art'}]},
        {'type': 14, 'spacing': 1},
    ]
    if not g.get('pending') and len(g['inputs']) > 1:
        # A button per platform, opening the page on that tab. Rows of three keep the labels readable.
        plats = [btn(i['label'], f'{url}?p={i["id"]}') for i in g['inputs']]
        for i in range(0, len(plats), 3):
            parts.append({'type': 1, 'components': plats[i:i + 3]})
    parts.append({'type': 1, 'components': [btn('All games', SITE), btn('Report a wrong code', REPO + '/issues')]})
    parts.append(text('-# Unofficial fan reference, not affiliated with Rockstar Games.'))
    return {'component': {'type': 17, 'accent_color': YELLOW, 'components': parts}}


def home_embed(games):
    total = sum(g['count'] for g in games if not g.get('pending'))
    gallery = [s for s in ('gta-vi', 'rdr2', 'gta-v', 'gta-sa') if any(g['slug'] == s for g in games)]
    titles = {g['slug']: g['title'] for g in games}
    fam = platform_list([p for g in games for p in g['platforms']])
    newest = max(games, key=lambda g: g['order'])
    return {'component': {'type': 17, 'accent_color': YELLOW, 'components': [
        {'type': 9, 'components': [text(f'# [Cheat Index]({SITE})\nEvery official cheat code Rockstar built into their games, '
                                        f'from GTA (1997) to {md(newest["short"])}. Pick a game, pick your platform, copy the code.')],
         'accessory': {'type': 11, 'media': {'url': SITE + 'assets/icon-512.png'}, 'description': 'Cheat Index icon'}},
        {'type': 12, 'items': [{'media': {'url': f'{SITE}covers/{s}.jpg'}, 'description': f'{titles[s]} cover art'} for s in gallery]},
        text(f'**{total} cheats** across **{len(games)} games**, for {fam}. No ads, and there never will be.'),
        {'type': 14, 'spacing': 1},
        {'type': 1, 'components': [btn('Browse all games', SITE), btn(f'{newest["short"]} cheats', page_url(newest['slug'])),
                                   btn('Report a wrong code', REPO + '/issues')]},
        text('-# Unofficial fan reference. Not affiliated with Rockstar Games or Take-Two Interactive.'),
    ]}}


def embed_tag(payload):
    # Compact JSON keeps it well under Discord's 3,000-byte limit. "</" is escaped so a code can't end the script.
    raw = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    return f'<script id="discord:component-embed" type="application/json">{raw}</script>'


# ---- Pre-rendered cheat list ------------------------------------------------------------------
# The game page's first view, written into the HTML so search engines see the codes and the list
# shows before any script runs. It copies what assets/game.js draws for the game's first platform
# with nothing filtered or starred, using the same classes, so the swap to the live list doesn't
# jump. If you change the markup in game.js's draw() or drawList(), change it here too.

PS_SYMBOLS = {'Cross': '✕', 'Circle': '○', 'Square': '□', 'Triangle': '△', 'Up': '↑', 'Down': '↓', 'Left': '←', 'Right': '→'}
ARROWS = {'Up': '↑', 'Down': '↓', 'Left': '←', 'Right': '→'}
STAR = 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z'
e = html.escape


def cheat_id(c):
    return re.sub(r'[^a-z0-9]+', '-', c['effect'].lower()).strip('-')


def code_for(c, inp):
    if inp['id'] in c.get('not', []):
        return None
    return c['codes'].get(inp.get('derive', inp['id']))


def combo_html(code, pad):
    """Keycaps, as CI.renderCombo() draws them. Only PlayStation and DS pads are ever a game's first tab."""
    keys = code.split(' ')
    hold = keys.pop(0)[5:] if keys[0].startswith('HOLD:') else None
    sym = ARROWS if pad == 'ds' else PS_SYMBOLS
    words = (f'Hold {hold}, then ' if hold else '') + ', '.join(keys)
    out = f'<span class="keys" role="img" aria-label="{e(words)}">'
    if hold:
        out += f'<span class="hold" aria-hidden="true">Hold {e(sym.get(hold, hold))}, then</span>'
    out += ''.join(f'<span class="key" aria-hidden="true">{e(sym.get(k, k))}</span>' for k in keys)
    return out + '</span>'


def issue_link(g, c, inp):
    q = urllib.parse.urlencode([('template', 'found-code.yml' if c.get('tbd') else 'wrong-code.yml'),
                                ('title', f'{g["short"]}: {c["effect"]} ({inp["label"]})'),
                                ('game', g['title']), ('platform', inp['label']), ('cheat', c['effect'])])
    return f'{REPO}/issues/new?{q}'


def nice_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f'{d.day} {d.strftime("%B")} {d.year}'


def prerender(g):
    title, short = e(g['title']), e(g['short'])
    consoles = e(', '.join(g.get('consoles') or g['platforms']))
    inp = g['inputs'][0] if g['inputs'] else None
    live = not g.get('pending') and g['cheats'] and inp
    rows = [c for c in g['cheats'] if c.get('tbd') or code_for(c, inp)] if live else []
    multi = live and len(g['inputs']) > 1
    count = str(len(rows)) if live else 'TBC'
    out = [
        '<div class="game-head"><div class="art"><span class="cover-slot has-art">'
        f'<img src="../../covers/{g["slug"]}.jpg" width="600" height="800" alt="{title} cover art" decoding="async" fetchpriority="high">'
        '</span></div>',
        f'<div class="info"><h1>{title}</h1><dl class="facts">'
        f'<div><dt>Input type</dt><dd>{e(" · ".join(g["methods"]))}</dd></div>'
        f'<div><dt>{"Cheats on " + e(inp["label"]) if multi else "Cheats"}</dt><dd class="big">{count}</dd></div>'
        f'<div><dt>Platforms</dt><dd class="plain">{consoles}</dd></div>'
        f'<div><dt>Released</dt><dd class="plain mono">{g["year"]}</dd></div>'
        '</dl></div></div>',
    ]
    if not live:
        out.append(f'<div class="state"><h2>No {short} cheats are confirmed yet.</h2>'
                   f'<p>{e(g.get("warning") or "This page fills in once codes are confirmed in the game.")}</p></div>')
        return '\n'.join(out)

    n = len(g['inputs'])
    seg = ''.join(f'<button type="button" aria-pressed="{"true" if i is inp else "false"}">{e(i["label"])}</button>' for i in g['inputs'])
    warn = f'<p class="warn">{e(g["warning"])}</p>' if g.get('warning') else ''
    out.append('<div class="howto">'
               f'<div class="pick"><div class="h" id="plat-l">Show codes for</div>'
               f'<div class="seg" role="group" aria-labelledby="plat-l" style="--n:{n};--cols:{3 if n > 4 else n}">{seg}</div></div>'
               f'<div class="text"><div class="h">How to enter</div><p>{e(inp["how"])}</p>{warn}</div></div>')

    cats = ['All'] + list(dict.fromkeys(c['category'] for c in rows))
    tabs = ''.join(f'<button class="tab" type="button" aria-pressed="{"true" if c == "All" else "false"}">{e(c)}</button>' for c in cats)
    summary = f'{len(rows)} cheat{"" if len(rows) == 1 else "s"} on {e(inp["label"])}'
    tbd = sum(1 for c in rows if c.get('tbd'))
    if tbd:
        summary += f', {tbd} code{"" if tbd == 1 else "s"} still to be found'
    head = {'combo': f'{e(inp["label"])} combo', 'phone': 'Phone number', 'phrase': 'Phrase'}.get(inp['type'], f'{e(inp["label"])} code')

    items = []
    for c in rows:
        eff, cid = e(c['effect']), cheat_id(c)
        if c.get('tbd'):
            code = '<span class="tbd">TBD<span class="sr">, code not found yet</span></span>'
        elif inp['type'] == 'combo':
            code = combo_html(code_for(c, inp), inp.get('pad'))
        else:
            code = f'<span class="code">{e(code_for(c, inp))}</span>'
        copy = '' if c.get('tbd') else f'<button class="btn" type="button" aria-label="Copy code for {eff}">Copy</button>'
        report = (f'<a class="report" href="{e(issue_link(g, c, inp))}" target="_blank" rel="noopener" '
                  f'aria-label="{"Send the code for " if c.get("tbd") else "Report a problem with the code for "}{eff}, opens GitHub in a new tab">'
                  f'{"Send code" if c.get("tbd") else "Report"}</a>')
        extra = ''
        if c.get('requirement'):
            extra += f'<p class="req"><b>Requirement: </b>{e(c["requirement"])}</p>'
        if c.get('risk'):
            extra += f'<p class="risk"><b>Careful: </b>{e(c["risk"])}</p>'
        if c.get('note'):
            extra += f'<p class="note">{e(c["note"])}</p>'
        items.append(
            f'<li class="cheat" id="c-{cid}"><span class="eff">'
            f'<button class="star" type="button" aria-pressed="false" aria-label="Star {eff}">'
            f'<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="{STAR}" stroke-linejoin="round"></path></svg></button>'
            f'<a class="eff-link" href="?p={inp["id"]}&amp;c={cid}">{eff}</a></span>'
            f'<span class="cat">{e(c["category"])}</span><span class="code-cell">{code}</span>'
            f'<span class="copy">{copy}{report}</span>{extra}</li>')

    after = ''
    if g.get('incomplete'):
        after += '<p class="muted" style="margin-top:20px">This list isn’t complete yet. More codes are coming.</p>'
    if g.get('checked'):
        after += (f'<p class="muted" style="margin-top:20px;font-size:15px">Codes last checked against sources on '
                  f'<time datetime="{g["checked"]}">{nice_date(g["checked"])}</time>.</p>')
    after += (f'<p class="muted foot-note" style="margin-top:24px;font-size:15px">Wrong or missing code? Use Report on the cheat, '
              f'<a href="{REPO}/issues">open an issue</a> or send a pull request on GitHub. Each game is one JSON file.</p>')
    out.append('<section class="list" aria-label="Cheat list">'
               '<div class="list-tools">'
               f'<div class="filter"><label for="fq">Filter {short} cheats</label>'
               '<input id="fq" type="search" autocomplete="off" spellcheck="false" placeholder="Effect or code, e.g. tank" aria-keyshortcuts="/"></div>'
               '<div class="tool-btns"><button class="btn print-btn" type="button">Print list</button></div></div>'
               f'<div><div class="top"><div class="tabs" role="group" aria-label="Category">{tabs}</div>'
               f'<span class="muted" style="font-size:14px" role="status">{summary}</span></div>'
               f'<div class="cheat-head" aria-hidden="true"><span>Effect</span><span>Category</span><span>{head}</span><span></span></div>'
               f'<ul class="cheats">\n' + '\n'.join(items) + '\n</ul></div>' + after + '</section>')
    return '\n'.join(out)


def describe(g):
    if g.get('pending'):
        return f'Cheat codes for {g["title"]} are not confirmed yet.'
    return (f'All {g["count"]} official {g["title"]} cheat codes for '
            f'{", ".join(g.get("consoles") or g["platforms"])}. Copy any code in one tap. No ads.')


def render():
    """Every generated file as {path: text}."""
    index = load('data/games.json')['games']
    template = open('.github/game-page.html', encoding='utf-8').read()
    out = {}
    for entry in index:
        g = load(f'data/{entry["slug"]}.json')
        g['count'] = entry['count']
        fill = {
            'slug': g['slug'], 'title': html.escape(g['title']), 'description': html.escape(describe(g)),
            'url': page_url(g['slug']), 'cover': f'{SITE}covers/{g["slug"]}.jpg',
            'embed': embed_tag(game_embed(g)),
            'prerender': prerender(g),
        }
        out[f'games/{g["slug"]}/index.html'] = re.sub(r'\{\{(\w+)\}\}', lambda m: fill[m.group(1)], template)

    home = open('index.html', encoding='utf-8').read()
    a, b = home.index(EMBED_START) + len(EMBED_START), home.index(EMBED_END)
    out['index.html'] = home[:a] + '\n' + embed_tag(home_embed(index)) + '\n' + home[b:]

    urls = [SITE] + [page_url(g['slug']) for g in index]
    out['sitemap.xml'] = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                          + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n')
    return out


def stale():
    """Generated files that don't match what's on disk."""
    bad = []
    for path, body in render().items():
        try:
            same = open(path, encoding='utf-8').read() == body
        except OSError:
            same = False
        if not same:
            bad.append(path)
    return bad


if __name__ == '__main__':
    for path, body in render().items():
        os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
        try:
            if open(path, encoding='utf-8').read() == body:
                continue
        except OSError:
            pass
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(body)
        print('wrote', path)

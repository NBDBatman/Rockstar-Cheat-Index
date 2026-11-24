"""Writes the pages that are made from the data. Run from the repo root: python3 .github/build_pages.py

- games/<slug>/index.html for every game, from .github/game-page.html. Each has its own title,
  description, canonical link, Open Graph tags and Discord embed, because link previews (Discord,
  search engines, chat apps) read the HTML without running the site's JavaScript.
- The Discord embed in index.html, between its BEGIN/END markers.
- sitemap.xml.

Run it after changing anything in data/ or the template, and commit what it writes. The data check
runs the same code and fails if a written file is out of date. Uses only the Python standard library.
"""
import html
import json
import os
import re

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


def combo_words(code):
    """PlayStation button names as a short sentence, like the Copy button gives on the PlayStation tab."""
    keys = code.split(' ')
    hold = None
    if keys[0].startswith('HOLD:'):
        hold = keys.pop(0)[5:]
    return (f'Hold {hold}, then ' if hold else '') + ', '.join(keys)


def code_for(c, inp):
    if inp['id'] in c.get('not', []):
        return None
    return c['codes'].get(inp.get('derive', inp['id']))


def examples(g, n=4):
    """A few cheats to show in the embed: one from each category in list order, on the first typed
    input if there is one (they're short), otherwise the first input. Never a TBD cheat."""
    inp = next((i for i in g['inputs'] if i['type'] != 'combo'), g['inputs'][0] if g['inputs'] else None)
    if not inp:
        return None, []
    have = [c for c in g['cheats'] if not c.get('tbd') and code_for(c, inp)]
    picked, cats = [], set()
    for c in have:
        if c['category'] not in cats:
            picked.append(c)
            cats.add(c['category'])
    for c in have:
        if c not in picked:
            picked.append(c)
    return inp, picked[:n]


def plural(n, word):
    return f'{n} {word}' + ('' if n == 1 else 's')


def game_embed(g):
    url = page_url(g['slug'])
    consoles = ', '.join(g.get('consoles') or g['platforms'])
    head = f'# [{md(g["title"])}]({url})\n'
    if g.get('pending'):
        head += f'No cheats are confirmed yet.\n-# {g["year"]} · {md(consoles)}'
    else:
        head += f'**{plural(len(g["cheats"]), "cheat")}** for {md(consoles)}\n-# {g["year"]} · {md(" · ".join(g["methods"]))}'
    parts = [{'type': 9, 'components': [text(head)],
              'accessory': {'type': 11, 'media': {'url': f'{SITE}covers/{g["slug"]}.jpg'}, 'description': f'{g["title"]} cover art'}}]

    inp, ex = examples(g)
    if ex:
        heading = {'phone': 'A few phone numbers', 'phrase': 'A few phrases'}.get(inp['type'], f'A few {md(inp["label"])} codes')
        lines = [f'**{heading}**']
        for c in ex:
            code = code_for(c, inp)
            shown = combo_words(code) if inp['type'] == 'combo' else code
            lines.append(f'`{shown}` {md(c["effect"])}')
        parts += [{'type': 14, 'spacing': 1}, text('\n'.join(lines))]
    tbd = sum(1 for c in g['cheats'] if c.get('tbd'))
    if tbd:
        parts.append(text(f'-# {tbd} of {len(g["cheats"])} codes are still to be found.'))

    if not g.get('pending') and len(g['inputs']) > 1:
        # A button per platform, opening the page on that tab. Rows of three keep the labels readable.
        plats = [btn(i['label'], f'{url}?p={i["id"]}') for i in g['inputs']]
        parts.append({'type': 14, 'spacing': 1})
        for i in range(0, len(plats), 3):
            parts.append({'type': 1, 'components': plats[i:i + 3]})
    else:
        parts.append({'type': 14, 'spacing': 1})
    parts.append({'type': 1, 'components': [btn('All games', SITE), btn('Report a wrong code', REPO + '/issues')]})
    note = ('-# ' + md(g['warning']) + '\n' if g.get('warning') else '') + '-# Unofficial fan reference, not affiliated with Rockstar Games.'
    parts.append(text(note))
    return {'component': {'type': 17, 'accent_color': YELLOW, 'components': parts}}


def home_embed(games):
    total = sum(g['count'] for g in games if not g.get('pending'))
    gallery = [s for s in ('gta-vi', 'rdr2', 'gta-v', 'gta-sa') if any(g['slug'] == s for g in games)]
    titles = {g['slug']: g['title'] for g in games}
    order = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Handheld']
    families = ['handhelds' if p == 'Handheld' else p for p in sorted({p for g in games for p in g['platforms']}, key=order.index)]
    fam = ', '.join(families[:-1]) + ' and ' + families[-1] if len(families) > 1 else families[0]
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

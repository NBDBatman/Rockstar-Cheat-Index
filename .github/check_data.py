"""Checks the cheat data before it goes live. Run from the repo root: python .github/check_data.py

Fails (exit 1) with a list of problems if anything in data/, covers/ or the pages written from them
(games/, sitemap.xml, the home page's Discord embed) is out of step.
Uses only the Python standard library.
"""
import datetime
import glob
import json
import os
import re
import struct
import sys

CATEGORIES = {'Player', 'Weapons', 'Money', 'Wanted', 'Vehicles', 'World', 'Pedestrians', 'Score', 'Levels', 'Other'}
INPUT_IDS = {'pc', 'ps', 'ps2', 'psp', 'ds', 'phone', 'phrase', 'mobile', 'xbox', 'xbox360', 'xboxog', 'switch'}
TYPES = {'text', 'combo', 'phone', 'phrase'}
PADS = {'ps', 'xbox', 'xbox360', 'xboxog', 'switch', 'ds'}
FAMILIES = {'PC', 'PlayStation', 'Xbox', 'Switch', 'Handheld'}
GAME_KEYS = ['slug', 'title', 'short', 'year', 'order', 'platforms', 'consoles', 'methods', 'inputs', 'warning', 'sources', 'checked', 'cheats']
SHARED = ['title', 'short', 'year', 'order', 'platforms', 'consoles', 'methods']
BUTTONS = {'Cross', 'Circle', 'Square', 'Triangle', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3', 'L', 'R',
           'Up', 'Down', 'Left', 'Right', 'A', 'B', 'X', 'Y', 'Start', 'Select'}

problems = []


def bad(where, msg):
    problems.append(f'{where}: {msg}')


def load(path):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError) as e:
        bad(path, f'not valid JSON ({e})')
        return None


def jpeg_size(path):
    """Width and height of a JPEG, read from its SOF marker."""
    with open(path, 'rb') as f:
        if f.read(2) != b'\xff\xd8':
            return None
        while True:
            b = f.read(1)
            while b and b != b'\xff':
                b = f.read(1)
            while b == b'\xff':
                b = f.read(1)
            if not b:
                return None
            marker = b[0]
            if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
                continue
            seg = f.read(2)
            if len(seg) < 2:
                return None
            length = struct.unpack('>H', seg)[0]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h, w = struct.unpack('>xHH', f.read(5))
                return w, h
            f.seek(length - 2, 1)


def check_combo(where, code, pad):
    keys = code.split(' ')
    if keys and keys[0].startswith('HOLD:'):
        keys[0] = keys[0][5:]
    for k in keys:
        if k not in BUTTONS:
            bad(where, f'unknown button "{k}" in combo "{code}"')
    if pad == 'ds' and any(k in ('Cross', 'Circle', 'Square', 'Triangle') for k in keys):
        bad(where, 'DS combos use A B X Y, not PlayStation names')


def check_text(where, text):
    if '—' in text:
        bad(where, 'contains an em dash')


def check_game(slug, entry):
    path = f'data/{slug}.json'
    if not os.path.exists(path):
        bad('data/games.json', f'{slug} has no {path}')
        return
    g = load(path)
    if g is None:
        return
    for k in GAME_KEYS:
        if k not in g:
            bad(path, f'missing "{k}"')
    if g.get('slug') != slug:
        bad(path, f'slug is "{g.get("slug")}", file is named {slug}')
    for k in SHARED:
        if g.get(k) != entry.get(k):
            bad(path, f'"{k}" is {g.get(k)!r} here but {entry.get(k)!r} in games.json')
    for fam in g.get('platforms', []):
        if fam not in FAMILIES:
            bad(path, f'platform "{fam}" should be one of {sorted(FAMILIES)}')

    cheats = g.get('cheats', [])
    if entry.get('count') != len(cheats):
        bad('data/games.json', f'{slug} count is {entry.get("count")} but the file has {len(cheats)} cheats')
    if g.get('pending'):
        return
    if not g.get('sources'):
        bad(path, 'no sources listed')
    try:
        if datetime.date.fromisoformat(g.get('checked', '')) > datetime.date.today() + datetime.timedelta(days=1):
            bad(path, '"checked" is in the future')
    except ValueError:
        bad(path, '"checked" should be a date like 2026-11-19, the day the codes were last checked against sources')

    inputs = {}
    for inp in g.get('inputs', []):
        iid = inp.get('id')
        if iid not in INPUT_IDS:
            bad(path, f'input id "{iid}" is not one of {sorted(INPUT_IDS)}')
        if inp.get('type') not in TYPES:
            bad(path, f'input {iid} has type "{inp.get("type")}"')
        if inp.get('type') == 'combo' and inp.get('pad') not in PADS:
            bad(path, f'combo input {iid} needs a pad of {sorted(PADS)}')
        if not inp.get('label') or not inp.get('how'):
            bad(path, f'input {iid} needs a label and how')
        check_text(f'{path} input {iid}', inp.get('how', ''))
        inputs[iid] = inp
    for inp in inputs.values():
        if inp.get('derive') and inp['derive'] not in inputs:
            bad(path, f'input {inp["id"]} derives from "{inp["derive"]}", which isn\'t an input')
    code_keys = {i for i, inp in inputs.items() if not inp.get('derive')}

    tbd = 0
    # Stars and cheat links are keyed by effect name, so two cheats with one name share a star and a link.
    seen = {}
    for n, c in enumerate(cheats, 1):
        where = f'{path} cheat {n} ({c.get("effect", "?")})'
        if not c.get('effect'):
            bad(where, 'no effect')
        else:
            link_id = re.sub(r'[^a-z0-9]+', '-', c['effect'].lower()).strip('-')
            if link_id in seen:
                bad(where, f'same effect name as cheat {seen[link_id]}; stars and links would treat them as one cheat')
            seen.setdefault(link_id, n)
        if c.get('category') not in CATEGORIES:
            bad(where, f'category "{c.get("category")}" is not one of {sorted(CATEGORIES)}')
        for field in ('effect', 'requirement', 'note', 'risk'):
            check_text(where, c.get(field) or '')
        for nid in c.get('not', []):
            if nid not in inputs:
                bad(where, f'"not" names "{nid}", which is not an input')
        codes = c.get('codes')
        if not isinstance(codes, dict):
            bad(where, 'codes should be an object')
            continue
        if c.get('tbd'):
            tbd += 1
            if codes:
                bad(where, 'marked tbd but has codes; remove "tbd" once the code is found')
            continue
        if not codes:
            bad(where, 'no codes (mark it "tbd": true if the code isn\'t known yet)')
        for k, v in codes.items():
            if k not in code_keys:
                bad(where, f'code key "{k}" has no matching input')
                continue
            if not isinstance(v, str) or not v.strip():
                bad(where, f'code "{k}" is empty')
                continue
            if inputs[k].get('type') == 'combo':
                check_combo(where, v, inputs[k].get('pad'))
    if tbd and not g.get('incomplete'):
        bad(path, f'{tbd} cheats are tbd, so "incomplete" should be true')

    cover = f'covers/{slug}.jpg'
    if not os.path.exists(cover):
        bad(cover, 'missing; every game needs its cover')
    else:
        size = jpeg_size(cover)
        if size != (600, 800):
            bad(cover, f'is {size}, should be (600, 800)')


def main():
    index = load('data/games.json')
    if index is None:
        return
    slugs = [g.get('slug') for g in index.get('games', [])]
    if len(set(slugs)) != len(slugs):
        bad('data/games.json', 'a slug is listed twice')
    for entry in index.get('games', []):
        check_game(entry.get('slug'), entry)
    for path in glob.glob('data/*.json'):
        name = os.path.basename(path)[:-5]
        if name != 'games' and name not in slugs:
            bad(path, 'not listed in data/games.json')
            load(path)
    if problems:
        return  # the pages are written from the data, so fix the data first
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    sys.dont_write_bytecode = True
    import build_pages
    try:
        for path in build_pages.stale():
            bad(path, 'out of date with the data; run python3 .github/build_pages.py and commit what it writes')
    except (OSError, ValueError, KeyError) as e:
        bad('.github/build_pages.py', f'could not write the pages ({e})')
        return
    for path in ['index.html'] + [f'games/{s}/index.html' for s in slugs]:
        check_discord_embed(path)


SITE = 'https://nbdbatman.github.io/Rockstar-Cheat-Index/'
EMBED_TYPES = {1, 2, 9, 10, 11, 12, 14, 17}
BUTTON_KEYS = {'id', 'type', 'url', 'style', 'label', 'emoji', 'disabled'}


def check_discord_embed(path):
    """A page's Discord link preview. Discord drops one that breaks its rules, sometimes with no
    preview at all. Rules: discord-api-docs, developers/link-previews/component-embeds.mdx."""
    where = f'{path} discord:component-embed'
    try:
        html = open(path, encoding='utf-8').read()
    except OSError:
        return
    m = re.search(r'<script id="discord:component-embed" type="application/json">(.*?)</script>', html, re.S)
    if not m:
        bad(where, 'missing')
        return
    raw = m.group(1).strip()
    if len(raw.encode('utf-8')) > 3000:
        bad(where, f'{len(raw.encode("utf-8"))} bytes; Discord allows 3,000')
    try:
        top = json.loads(raw)['component']
    except (ValueError, KeyError, TypeError) as e:
        bad(where, f'not valid ({e})')
        return
    if top.get('type') != 17:
        bad(where, 'the top-level component must be a Container (type 17)')
    found = []

    def walk(c, depth):
        found.append(c)
        t = c.get('type')
        if t not in EMBED_TYPES:
            bad(where, f'component type {t} is not allowed in a component embed')
        if t == 17 and depth:
            bad(where, 'a Container cannot hold another Container')
        if t == 2:
            if c.get('style') != 5 or not c.get('url', '').startswith('https://'):
                bad(where, f'button "{c.get("label")}" must be a link button (style 5) with an https url')
            if set(c) - BUTTON_KEYS:
                bad(where, f'button "{c.get("label")}" has keys Discord rejects: {sorted(set(c) - BUTTON_KEYS)}')
        if t == 10:
            check_text(where, c.get('content', ''))
        media = [c.get('media')] + [i.get('media') for i in c.get('items', [])]
        for md in filter(None, media):
            url = md.get('url', '')
            if url.startswith(SITE) and not os.path.isfile(url[len(SITE):]):
                bad(where, f'image {url} is not in the repo')
        for k in c.get('components', []) + ([c['accessory']] if 'accessory' in c else []):
            walk(k, depth + 1)

    walk(top, 0)
    if len(found) > 40:
        bad(where, f'{len(found)} components; Discord allows 40')


if __name__ == '__main__':
    main()
    if problems:
        print(f'{len(problems)} problem(s) found:')
        for p in problems:
            print(' - ' + p)
        sys.exit(1)
    print('Data looks good.')

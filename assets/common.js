// Shared helpers for both pages.
var CI = (function () {
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return r.json();
    });
  }

  // Theme toggle. The label names the mode you switch to.
  function syncTheme() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    document.querySelectorAll('[data-theme-label]').forEach(function (s) { s.textContent = light ? 'Dark mode' : 'Light mode'; });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]');
    if (!b) return;
    var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('ci-theme', next); } catch (err) {}
    syncTheme();
  });
  syncTheme();

  // Button combos. Data is stored with PlayStation names; Xbox is mapped from them.
  var PS = { Cross: '✕', Circle: '○', Square: '□', Triangle: '△', Up: '↑', Down: '↓', Left: '←', Right: '→' };
  var XBOX = { Cross: 'A', Circle: 'B', Square: 'X', Triangle: 'Y', L1: 'LB', R1: 'RB', L2: 'LT', R2: 'RT', Up: '↑', Down: '↓', Left: '←', Right: '→' };
  var XBOX_WORDS = { Cross: 'A', Circle: 'B', Square: 'X', Triangle: 'Y', L1: 'LB', R1: 'RB', L2: 'LT', R2: 'RT' };
  var DS = { Up: '↑', Down: '↓', Left: '←', Right: '→' };
  // Switch (Definitive Edition): same button positions as PlayStation, Nintendo letters.
  var SWITCH_WORDS = { Cross: 'B', Circle: 'A', Square: 'Y', Triangle: 'X', L1: 'L', R1: 'R', L2: 'ZL', R2: 'ZR' };
  var SWITCH = { Cross: 'B', Circle: 'A', Square: 'Y', Triangle: 'X', L1: 'L', R1: 'R', L2: 'ZL', R2: 'ZR', Up: '↑', Down: '↓', Left: '←', Right: '→' };
  // San Andreas on Xbox 360 (2014) has bumpers and triggers the other way round from later Xboxes.
  var X360_WORDS = { Cross: 'A', Circle: 'B', Square: 'X', Triangle: 'Y', L1: 'LT', R1: 'RT', L2: 'LB', R2: 'RB' };
  var X360 = { Cross: 'A', Circle: 'B', Square: 'X', Triangle: 'Y', L1: 'LT', R1: 'RT', L2: 'LB', R2: 'RB', Up: '↑', Down: '↓', Left: '←', Right: '→' };
  // The original Xbox (2003 to 2005) had triggers plus White and Black buttons instead of bumpers.
  var XOG_WORDS = { Cross: 'A', Circle: 'B', Square: 'X', Triangle: 'Y', L1: 'L trigger', R1: 'R trigger', L2: 'White', R2: 'Black' };
  var XOG = { Cross: 'A', Circle: 'B', Square: 'X', Triangle: 'Y', L1: 'L', R1: 'R', L2: 'White', R2: 'Black', Up: '↑', Down: '↓', Left: '←', Right: '→' };
  var WORDS = { xbox: XBOX_WORDS, 'switch': SWITCH_WORDS, xbox360: X360_WORDS, xboxog: XOG_WORDS };
  var MAPS = { xbox: XBOX, 'switch': SWITCH, xbox360: X360, xboxog: XOG, ds: DS };

  function parseCombo(s) {
    var hold = null;
    if (s.indexOf('HOLD:') === 0) { var sp = s.indexOf(' '); hold = s.slice(5, sp); s = s.slice(sp + 1); }
    return { hold: hold, keys: s.split(' ').filter(Boolean) };
  }
  function comboWords(s, pad) {
    var c = parseCombo(s);
    var w = WORDS[pad] || {};
    var words = c.keys.map(function (k) { return w[k] || k; });
    var h = c.hold ? (w[c.hold] || c.hold) : null;
    return (h ? 'Hold ' + h + ', then ' : '') + words.join(', ');
  }
  function renderCombo(s, pad) {
    var c = parseCombo(s);
    var map = MAPS[pad] || PS;
    var wrap = el('span', { class: 'keys', role: 'img', 'aria-label': comboWords(s, pad) });
    if (c.hold) wrap.appendChild(el('span', { class: 'hold', 'aria-hidden': 'true', text: 'Hold ' + (map[c.hold] || c.hold) + ', then' }));
    c.keys.forEach(function (k) { wrap.appendChild(el('span', { class: 'key', 'aria-hidden': 'true', text: map[k] || k })); });
    return wrap;
  }

  // Controller practice. Browsers number buttons by position (the "standard" layout): 0 is the
  // bottom face button, 12 to 15 are the d-pad. Codes are stored by position too, so one table
  // works for PlayStation, Xbox and Switch pads. Only the tabs below can be practised.
  var POS = { Cross: 0, Circle: 1, Square: 2, Triangle: 3, L1: 4, R1: 5, L2: 6, R2: 7, L: 4, R: 5,
    Select: 8, Start: 9, L3: 10, R3: 11, Up: 12, Down: 13, Left: 14, Right: 15 };
  var PAD_POS = {
    ps: POS, xbox: POS, 'switch': POS,
    xbox360: Object.assign({}, POS, { L1: 6, L2: 4, R1: 7, R2: 5 }),
    ds: Object.assign({}, POS, { A: 1, B: 0, X: 3, Y: 2 })
  };
  // Standard button numbers for a combo, or null if this tab can't be practised.
  function padButtons(s, pad) {
    var t = PAD_POS[pad];
    if (!t) return null;
    var c = parseCombo(s);
    var keys = c.keys.map(function (k) { return t[k]; });
    var hold = c.hold ? t[c.hold] : null;
    if (keys.some(function (k) { return k === undefined; }) || hold === undefined) return null;
    return { keys: keys, hold: hold };
  }

  // Cover art: shows covers/<slug>.jpg when the file exists, otherwise a labelled slot.
  function cover(game, big) {
    var slot = el('span', { class: 'cover-slot' }, [
      el('span', { class: 'lbl', text: 'Cover art' }),
      big ? el('span', { class: 't', text: game.title }) : el('span', { class: 't', text: game.title }),
      big ? el('span', { class: 'path', text: 'covers/' + game.slug + '.jpg' }) : null
    ]);
    // The img goes in the slot straight away (invisible) so loading="lazy" works:
    // browsers don't start a lazy image until it is in the document.
    var img = new Image();
    img.alt = '';
    img.width = 600; img.height = 800;
    img.decoding = 'async';
    if (!big) img.loading = 'lazy'; else img.setAttribute('fetchpriority', 'high');
    img.onload = function () { slot.classList.add('has-art'); img.alt = game.title + ' cover art'; };
    img.onerror = function () { img.remove(); };
    img.src = 'covers/' + game.slug + '.jpg';
    slot.appendChild(img);
    return slot;
  }

  function countText(g) { return g.pending ? 'TBC' : String(g.count); }

  // Re-rendering replaces buttons, so remember which one had focus (by its data-fk key)
  // and put focus back on its replacement.
  function focusKey() {
    var a = document.activeElement;
    return a && a.getAttribute ? a.getAttribute('data-fk') : null;
  }
  function restoreFocus(root, key) {
    if (!key) return;
    var t = root.querySelector('[data-fk="' + CSS.escape(key) + '"]');
    if (t) t.focus({ preventScroll: true });
  }

  // Resolves once the text is on the clipboard, rejects if it couldn't be copied.
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = el('textarea', { readonly: true, 'aria-hidden': 'true', style: 'position:fixed;top:0;left:0;opacity:0' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      if (ok) resolve(); else reject(new Error('copy failed'));
    });
  }

  // Live-region message. Cleared first so the same message is read again.
  function announce(node, msg) {
    node.textContent = '';
    setTimeout(function () { node.textContent = msg; }, 50);
  }

  // The visitor's last picked game, saved in their browser like the theme.
  function lastGame(slug) {
    try {
      if (slug) localStorage.setItem('ci-game', slug);
      else return localStorage.getItem('ci-game');
    } catch (e) {}
    return null;
  }

  // The visitor's last picked platform id (pc, ps, xbox...), used to open the next game on it.
  function lastPlatform(id) {
    try {
      if (id) localStorage.setItem('ci-plat', id);
      else return localStorage.getItem('ci-plat');
    } catch (e) {}
    return null;
  }

  // Starred cheats, by game slug: { "gta-sa": ["Effect name", ...] }. Kept in memory too,
  // so starring still works for the visit when the browser blocks storage.
  var starMem = null;
  function readStars() {
    if (starMem) return starMem;
    try { starMem = JSON.parse(localStorage.getItem('ci-stars') || '{}') || {}; } catch (e) { starMem = {}; }
    return starMem;
  }
  function stars(slug) { return (readStars()[slug] || []).slice(); }
  function setStars(slug, list) {
    var all = readStars();
    if (list.length) all[slug] = list; else delete all[slug];
    try { localStorage.setItem('ci-stars', JSON.stringify(all)); } catch (e) {}
  }

  // Press / to jump to the search box (home) or the filter (game page), unless already typing.
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var a = document.activeElement;
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
    var box = document.getElementById('q') || document.getElementById('fq');
    if (!box) return;
    e.preventDefault();
    box.focus();
    box.select();
  });

  // Works offline after the first visit. Browsers only allow this on https and localhost.
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  return { el: el, getJSON: getJSON, lastGame: lastGame, lastPlatform: lastPlatform, stars: stars, setStars: setStars,
    renderCombo: renderCombo, comboWords: comboWords, padButtons: padButtons, cover: cover, countText: countText,
    focusKey: focusKey, restoreFocus: restoreFocus, copy: copy, announce: announce };
})();

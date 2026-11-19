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

  function parseCombo(s) {
    var hold = null;
    if (s.indexOf('HOLD:') === 0) { var sp = s.indexOf(' '); hold = s.slice(5, sp); s = s.slice(sp + 1); }
    return { hold: hold, keys: s.split(' ').filter(Boolean) };
  }
  function comboWords(s, pad) {
    var c = parseCombo(s);
    var words = c.keys.map(function (k) { return pad === 'xbox' ? (XBOX_WORDS[k] || k) : k; });
    var h = c.hold ? (pad === 'xbox' ? (XBOX_WORDS[c.hold] || c.hold) : c.hold) : null;
    return (h ? 'Hold ' + h + ', then ' : '') + words.join(', ');
  }
  function renderCombo(s, pad) {
    var c = parseCombo(s);
    var map = pad === 'xbox' ? XBOX : pad === 'ds' ? DS : PS;
    var wrap = el('span', { class: 'keys', role: 'img', 'aria-label': comboWords(s, pad) });
    if (c.hold) wrap.appendChild(el('span', { class: 'hold', 'aria-hidden': 'true', text: 'Hold ' + (map[c.hold] || c.hold) + ', then' }));
    c.keys.forEach(function (k) { wrap.appendChild(el('span', { class: 'key', 'aria-hidden': 'true', text: map[k] || k })); });
    return wrap;
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

  return { el: el, getJSON: getJSON, lastGame: lastGame, renderCombo: renderCombo, comboWords: comboWords, cover: cover, countText: countText,
    focusKey: focusKey, restoreFocus: restoreFocus, copy: copy, announce: announce };
})();

// Game page. game.html?g=<slug> (or game.html#<slug>) loads data/<slug>.json and renders the cheat list.
// A platform can be added to share a view: ?g=gta-sa&p=xbox or #gta-sa/xbox, and a cheat with &c=<cheat id>.
(function () {
  var el = CI.el;
  var page = document.getElementById('page');
  var REPO = 'https://github.com/NBDBatman/Rockstar-Cheat-Index';
  var route = parseRoute();
  var state = { game: null, input: null, cat: 'All', copied: null, q: '', stars: [], target: route.cheat };
  var listBox = null, printBtn = null;
  // Controller practice: state.practice is { id, effect, keys, hold, pos, done } while a combo is being practised.
  var padSeen = false, prevButtons = [];

  function parseRoute() {
    var h = location.hash.slice(1).split('/');
    var p = new URLSearchParams(location.search);
    return { slug: h[0] || p.get('g') || '', plat: h[1] || p.get('p') || '', cheat: p.get('c') || '' };
  }

  // A cheat's id in links: its effect in lowercase, words joined by hyphens.
  function cheatId(c) {
    return c.effect.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function showState(kind, title, body, action) {
    page.innerHTML = '';
    var box = el('div', { class: 'state', role: kind === 'error' ? 'alert' : 'status', 'aria-busy': kind === 'loading' ? 'true' : null }, [
      el('h2', { text: title }), body ? el('p', { text: body }) : null
    ]);
    if (kind === 'loading') box.appendChild(el('div', { class: 'bars', 'aria-hidden': 'true' }, [el('div'), el('div'), el('div')]));
    if (action) box.appendChild(action);
    page.appendChild(box);
  }

  // Platform to open on: the one in the link, then the visitor's last pick, then the first.
  // PlayStation and PS2 count as the same pick, so a PS2-only game still opens on it. Older Xboxes fall back to Xbox.
  function pickInput(g, wanted) {
    var alias = { ps: 'ps2', ps2: 'ps', xbox360: 'xbox', xboxog: 'xbox' };
    var tries = [wanted, CI.lastPlatform()];
    for (var i = 0; i < tries.length; i++) {
      var id = tries[i];
      if (!id) continue;
      var hit = g.inputs.filter(function (x) { return x.id === id; })[0] ||
        g.inputs.filter(function (x) { return x.id === alias[id]; })[0];
      if (hit) return hit;
    }
    return g.inputs[0] || null;
  }

  function codeFor(c, input) {
    // "not" hides a cheat on tabs where it doesn't work, such as Definitive Edition-only tabs.
    if (c.not && c.not.indexOf(input.id) !== -1) return null;
    var v = c.codes[input.derive || input.id];
    return v || null;
  }

  function copyText(c, input) {
    var v = codeFor(c, input);
    if (!v) return '';
    return input.type === 'combo' ? CI.comboWords(v, input.pad) : v;
  }

  function searchText(c, input) {
    var v = codeFor(c, input) || '';
    return [c.effect, c.category, c.requirement, c.note, v, input.type === 'combo' && v ? CI.comboWords(v, input.pad) : '']
      .join(' ').toLowerCase();
  }

  function codeCell(c, input) {
    if (c.tbd) return el('span', { class: 'tbd' }, ['TBD', el('span', { class: 'sr', text: ', code not found yet' })]);
    var v = codeFor(c, input);
    if (input.type === 'combo') return CI.renderCombo(v, input.pad);
    return el('span', { class: 'code', text: v });
  }

  // Opens a GitHub issue form with the game, platform and cheat already filled in.
  function issueLink(g, c, input) {
    var p = new URLSearchParams();
    p.set('template', c.tbd ? 'found-code.yml' : 'wrong-code.yml');
    p.set('title', g.short + ': ' + c.effect + ' (' + input.label + ')');
    p.set('game', g.title);
    p.set('platform', input.label);
    p.set('cheat', c.effect);
    return REPO + '/issues/new?' + p.toString();
  }

  function shareURL(cid) {
    var u = 'game.html?g=' + state.game.slug + '&p=' + state.input.id;
    cid = cid === undefined ? state.target : cid;
    return cid ? u + '&c=' + cid : u;
  }

  var STAR = 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z';
  function starIcon() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '20'); svg.setAttribute('height', '20'); svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', STAR);
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  // Controller practice. Uses the browser's built-in Gamepad API, polled once a frame while practising.
  function pads() {
    var list = navigator.getGamepads ? navigator.getGamepads() : [];
    return Array.prototype.filter.call(list || [], function (p) { return p && p.connected; });
  }
  function pressed() {
    var p = pads()[0];
    return p ? p.buttons.map(function (b) { return b.pressed || b.value > 0.5; }) : [];
  }
  function canPractise(c, input) {
    return padSeen && input.type === 'combo' && !c.tbd && !!CI.padButtons(codeFor(c, input) || '', input.pad);
  }
  function startPractice(c, id) {
    var b = CI.padButtons(codeFor(c, state.input), state.input.pad);
    state.practice = { id: id, effect: c.effect, keys: b.keys, hold: b.hold, pos: 0, done: false };
    prevButtons = pressed();
    render('prac:' + id);
    CI.announce(document.getElementById('announce'), 'Practising ' + c.effect + '. Press the buttons on your controller. Escape stops.');
    requestAnimationFrame(tick);
  }
  function stopPractice() {
    if (!state.practice) return;
    var id = state.practice.id;
    state.practice = null;
    render('prac:' + id);
    CI.announce(document.getElementById('announce'), 'Stopped practising.');
  }
  // Marks progress on the practised row's keycaps without redrawing the page.
  function showProgress() {
    var pr = state.practice;
    var row = pr && page.querySelector('[data-prac="' + CSS.escape(pr.id) + '"]');
    if (!row) return;
    row.querySelectorAll('.key').forEach(function (k, i) {
      k.classList.toggle('hit', i < pr.pos);
      k.classList.toggle('next', !pr.done && i === pr.pos);
    });
    var h = row.querySelector('.hold');
    if (h) h.classList.toggle('on', pr.hold !== null && !!pressed()[pr.hold]);
  }
  function tick() {
    var pr = state.practice;
    if (!pr) return;
    var now = pressed();
    if (!pr.done) {
      // A held button has to stay down for the whole combo.
      if (pr.hold !== null && !now[pr.hold] && pr.pos > 0) pr.pos = 0;
      for (var i = 0; i < now.length && i <= 15; i++) {
        if (!now[i] || prevButtons[i] || i === pr.hold) continue;
        if (pr.hold !== null && !now[pr.hold]) { pr.pos = 0; continue; }
        if (i === pr.keys[pr.pos]) pr.pos++;
        else pr.pos = i === pr.keys[0] ? 1 : 0;
        if (pr.pos === pr.keys.length) break;
      }
      if (pr.pos === pr.keys.length) finish(pr);
    }
    prevButtons = now;
    showProgress();
    requestAnimationFrame(tick);
  }
  function finish(pr) {
    pr.done = true;
    var btn = page.querySelector('[data-fk="prac:' + CSS.escape(pr.id) + '"]');
    if (btn) btn.textContent = 'Done';
    CI.announce(document.getElementById('announce'), 'Done. That\u2019s the code for ' + pr.effect + '.');
    // Leave it lit for a moment, then reset so it can be tried again.
    setTimeout(function () {
      if (state.practice !== pr) return;
      pr.done = false; pr.pos = 0;
      if (btn) btn.textContent = 'Stop';
    }, 1500);
  }
  window.addEventListener('gamepadconnected', function () {
    if (padSeen) return;
    padSeen = true;
    if (state.game) render();
    if (state.input && state.input.type === 'combo') CI.announce(document.getElementById('announce'), 'Controller connected. Choose Practise on a cheat to try its combo.');
  });
  window.addEventListener('gamepaddisconnected', function () {
    if (pads().length) return;
    padSeen = false;
    state.practice = null;
    if (state.game) render();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.practice) stopPractice(); });

  function render(fk) {
    fk = fk || CI.focusKey();
    draw();
    CI.restoreFocus(page, fk);
  }

  function onPlatform(g, input) {
    return g.cheats.filter(function (c) { return c.tbd || codeFor(c, input); });
  }

  function draw() {
    var g = state.game, input = state.input;
    page.innerHTML = '';
    listBox = null;
    var live = !(g.pending || !g.cheats.length);
    var onPlat = live ? onPlatform(g, input) : [];

    // The count follows the platform, so it always agrees with the list below.
    var multi = live && g.inputs.length > 1;
    var facts = el('dl', { class: 'facts' }, [
      el('div', null, [el('dt', { text: 'Input type' }), el('dd', { text: g.methods.join(' · ') })]),
      el('div', null, [el('dt', { text: multi ? 'Cheats on ' + input.label : 'Cheats' }), el('dd', { class: 'big', text: live ? String(onPlat.length) : CI.countText(g) })]),
      el('div', null, [el('dt', { text: 'Platforms' }), el('dd', { class: 'plain', text: (g.consoles || g.platforms).join(', ') })]),
      el('div', null, [el('dt', { text: 'Released' }), el('dd', { class: 'plain mono', text: String(g.year) })])
    ]);
    page.appendChild(el('div', { class: 'game-head' }, [
      el('div', { class: 'art' }, [CI.cover(g, true)]),
      el('div', { class: 'info' }, [el('h1', { text: g.title }), facts])
    ]));

    if (!live) {
      page.appendChild(el('div', { class: 'state' }, [
        el('h2', { text: 'No ' + g.short + ' cheats are confirmed yet.' }),
        el('p', { text: g.warning || 'This page fills in once codes are confirmed in the game.' })
      ]));
      return;
    }

    // Platform switch and how-to.
    // More than four platforms go in rows of three, so labels like "Xbox One/Series" fit.
    var n = g.inputs.length;
    var seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'plat-l', style: '--n:' + n + ';--cols:' + (n > 4 ? 3 : n) });
    g.inputs.forEach(function (inp) {
      seg.appendChild(el('button', { type: 'button', 'data-fk': 'plat:' + inp.id, 'aria-pressed': String(inp.id === input.id), text: inp.label,
        onclick: function () {
          state.input = inp; state.copied = null; state.practice = null;
          CI.lastPlatform(inp.id);
          try { history.replaceState(null, '', shareURL()); } catch (e) {}
          render();
        } }));
    });
    page.appendChild(el('div', { class: 'howto' }, [
      el('div', { class: 'pick' }, [el('div', { class: 'h', id: 'plat-l', text: 'Show codes for' }), seg]),
      el('div', { class: 'text' }, [el('div', { class: 'h', text: 'How to enter' }), el('p', { text: input.how }), g.warning ? el('p', { class: 'warn', text: g.warning }) : null])
    ]));

    // Filter box. Typing only redraws the list, so the box keeps focus and the caret.
    var q = el('input', { id: 'fq', type: 'search', autocomplete: 'off', spellcheck: 'false', placeholder: 'Effect or code, e.g. tank',
      oninput: function (e) { state.q = e.target.value; drawList(); } });
    q.value = state.q;
    q.setAttribute('aria-keyshortcuts', '/');
    // Print uses what's on screen, so the Starred tab or a filter prints just those cheats.
    printBtn = el('button', { class: 'btn print-btn', type: 'button', 'data-fk': 'print', text: 'Print list', onclick: function () { window.print(); } });
    var tools = el('div', { class: 'list-tools' }, [
      el('div', { class: 'filter' }, [el('label', { for: 'fq', text: 'Filter ' + g.short + ' cheats' }), q]),
      printBtn
    ]);

    listBox = el('div');
    page.appendChild(el('section', { class: 'list', 'aria-label': 'Cheat list' }, [
      tools,
      listBox,
      g.incomplete ? el('p', { class: 'muted', style: 'margin-top:20px', text: 'This list isn’t complete yet. More codes are coming.' }) : null,
      g.checked ? el('p', { class: 'muted', style: 'margin-top:20px;font-size:15px' }, ['Codes last checked against sources on ', el('time', { datetime: g.checked, text: niceDate(g.checked) }), '.']) : null,
      el('p', { class: 'muted foot-note', style: 'margin-top:24px;font-size:15px' }, ['Wrong or missing code? Use Report on the cheat, ', el('a', { href: REPO + '/issues', text: 'open an issue' }), ' or send a pull request on GitHub. Each game is one JSON file.'])
    ]));
    drawList();
  }

  function drawList() {
    var g = state.game, input = state.input;
    var onPlat = onPlatform(g, input);
    var starred = state.stars;
    var isStar = function (c) { return starred.indexOf(c.effect) !== -1; };

    // Category tabs come from every cheat on this platform, so they don't jump about while typing.
    var cats = ['All'];
    if (onPlat.some(isStar)) cats.push('Starred');
    onPlat.forEach(function (c) { if (cats.indexOf(c.category) === -1) cats.push(c.category); });
    if (cats.indexOf(state.cat) === -1) state.cat = 'All';

    var needle = state.q.trim().toLowerCase();
    var rows = onPlat.filter(function (c) {
      if (state.cat === 'Starred' ? !isStar(c) : state.cat !== 'All' && c.category !== state.cat) return false;
      return !needle || searchText(c, input).indexOf(needle) !== -1;
    });

    var plural = function (n) { return n + (n === 1 ? ' cheat' : ' cheats'); };
    var summary = state.cat === 'All' && !needle
      ? plural(rows.length) + ' on ' + input.label
      : rows.length + ' of ' + plural(onPlat.length) + ' on ' + input.label;
    var tbdCount = rows.filter(function (c) { return c.tbd; }).length;
    if (tbdCount) summary += ', ' + tbdCount + (tbdCount === 1 ? ' code' : ' codes') + ' still to be found';

    var tabBox = el('div', { class: 'tabs', role: 'group', 'aria-label': 'Category' });
    cats.forEach(function (cat) {
      tabBox.appendChild(el('button', { class: 'tab', type: 'button', 'data-fk': 'cat:' + cat, 'aria-pressed': String(cat === state.cat), text: cat,
        onclick: function () { state.cat = cat; render(); } }));
    });

    printBtn.textContent = state.cat === 'Starred' ? 'Print starred' : state.cat === 'All' && !needle ? 'Print list' : 'Print these';

    var list = el('ul', { class: 'cheats' });
    rows.forEach(function (c, i) {
      var id = c.effect + '|' + i;
      var on = isStar(c);
      var cid = cheatId(c);
      var hit = cid === state.target;
      var practising = !!(state.practice && state.practice.id === id);
      list.appendChild(el('li', { class: 'cheat' + (on ? ' starred' : '') + (hit ? ' target' : ''), id: 'c-' + cid, 'data-prac': practising ? id : null }, [
        el('span', { class: 'eff' }, [
          el('button', { class: 'star', type: 'button', 'data-fk': 'star:' + c.effect, 'aria-pressed': String(on), 'aria-label': 'Star ' + c.effect,
            onclick: function () { toggleStar(c); } }, [starIcon()]),
          // The effect name links to this cheat, so one code can be shared.
          el('a', { class: 'eff-link', href: shareURL(cid), 'data-fk': 'link:' + c.effect, 'aria-current': hit ? 'true' : null, text: c.effect,
            onclick: function (e) {
              if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
              e.preventDefault();
              state.target = cid;
              try { history.replaceState(null, '', shareURL()); } catch (err) {}
              render('link:' + c.effect);
              CI.announce(document.getElementById('announce'), 'The address now links to ' + c.effect + '.');
            } })
        ]),
        el('span', { class: 'cat', text: c.category }),
        el('span', { class: 'code-cell' }, [codeCell(c, input)]),
        el('span', { class: 'copy' }, [
          c.tbd ? null : el('button', { class: 'btn', type: 'button', 'data-fk': 'copy:' + id, 'aria-label': 'Copy code for ' + c.effect,
            text: state.copied && state.copied.id === id ? (state.copied.ok ? 'Copied' : 'Failed') : 'Copy',
            onclick: function () {
              function done(ok) {
                state.copied = { id: id, ok: ok };
                render('copy:' + id);
                CI.announce(document.getElementById('announce'), ok
                  ? 'Copied the code for ' + c.effect + '.'
                  : 'Couldn’t copy the code for ' + c.effect + '. Select it and copy it yourself.');
              }
              CI.copy(copyText(c, input)).then(function () { done(true); }, function () { done(false); });
            } }),
          canPractise(c, input) ? el('button', { class: 'btn practise', type: 'button', 'data-fk': 'prac:' + id, 'aria-pressed': String(practising),
            'aria-label': (practising ? 'Stop practising ' : 'Practise the combo for ') + c.effect + ' on your controller',
            text: practising ? (state.practice.done ? 'Done' : 'Stop') : 'Practise',
            onclick: function () { if (practising) stopPractice(); else startPractice(c, id); } }) : null,
          el('a', { class: 'report', href: issueLink(g, c, input), target: '_blank', rel: 'noopener',
            'aria-label': (c.tbd ? 'Send the code for ' : 'Report a problem with the code for ') + c.effect + ', opens GitHub in a new tab',
            text: c.tbd ? 'Send code' : 'Report' })
        ]),
        c.requirement ? el('p', { class: 'req' }, [el('b', { text: 'Requirement: ' }), c.requirement]) : null,
        c.risk ? el('p', { class: 'risk' }, [el('b', { text: 'Careful: ' }), c.risk]) : null,
        c.note ? el('p', { class: 'note', text: c.note }) : null
      ]));
    });

    var codeHead = input.type === 'combo' ? input.label + ' combo' : input.type === 'phone' ? 'Phone number' : input.type === 'phrase' ? 'Phrase' : input.label + ' code';
    listBox.innerHTML = '';
    if (padSeen && input.type === 'combo' && rows.some(function (c) { return canPractise(c, input); })) {
      listBox.appendChild(el('p', { class: 'pad-note' }, ['Controller connected. Choose ', el('b', { text: 'Practise' }), ' on a cheat, then enter the combo. Each button lights up as you get it right.']));
    }
    listBox.appendChild(el('div', { class: 'top' }, [tabBox, el('span', { class: 'muted', style: 'font-size:14px', role: 'status', text: summary })]));
    if (!rows.length) {
      listBox.appendChild(el('div', { class: 'empty' }, [
        el('p', { text: 'No ' + g.short + ' cheats match “' + state.q.trim() + '”' + (state.cat === 'All' ? '' : ' in ' + state.cat) + '.' }),
        el('p', { text: 'Try another word, or clear the filter.' }),
        el('button', { class: 'btn', type: 'button', text: 'Clear filter', onclick: function () {
          state.q = ''; state.cat = 'All';
          render();
          document.getElementById('fq').focus();
        } })
      ]));
      return;
    }
    listBox.appendChild(el('div', { class: 'cheat-head', 'aria-hidden': 'true' }, [el('span', { text: 'Effect' }), el('span', { text: 'Category' }), el('span', { text: codeHead }), el('span')]));
    listBox.appendChild(list);
    showProgress();
  }

  function toggleStar(c) {
    var i = state.stars.indexOf(c.effect);
    if (i === -1) state.stars.push(c.effect); else state.stars.splice(i, 1);
    CI.setStars(state.game.slug, state.stars);
    render('star:' + c.effect);
    // Unstarring on the Starred tab removes the row, so move focus to the tab instead of losing it.
    if (!page.contains(document.activeElement)) CI.restoreFocus(page, 'cat:' + state.cat);
    CI.announce(document.getElementById('announce'), (i === -1 ? 'Starred ' : 'Removed the star from ') + c.effect + '.');
  }

  function niceDate(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function setMeta(g) {
    document.title = g.title + ' cheats | Cheat Index';
    var d = document.querySelector('meta[name="description"]');
    var text = g.pending ? 'Cheat codes for ' + g.title + ' are not confirmed yet.'
      : 'All ' + g.count + ' official ' + g.title + ' cheat codes for ' + (g.consoles || g.platforms).join(', ') + '. Copy any code in one tap. No ads.';
    if (d) d.setAttribute('content', text);
    // game.html has no canonical of its own: one pointing at the bare page would tell search
    // engines every game is the same page. Each game gets its own once it loads.
    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) { canon = el('link', { rel: 'canonical' }); document.head.appendChild(canon); }
    canon.setAttribute('href', 'https://nbdbatman.github.io/Rockstar-Cheat-Index/game.html?g=' + g.slug);
  }

  function load() {
    var slug = route.slug;
    if (!/^[a-z0-9-]+$/.test(slug)) {
      document.getElementById('crumb').textContent = 'Not found';
      showState('error', 'That game isn’t in the index.', 'Pick a game from the list instead.', el('a', { class: 'btn-primary', href: './', text: 'Back to all games' }));
      return;
    }
    showState('loading', 'Loading cheats…');
    CI.getJSON('data/' + slug + '.json').then(function (g) {
      state.game = g;
      state.input = pickInput(g, route.plat);
      state.stars = CI.stars(g.slug);
      padSeen = pads().length > 0;
      setMeta(g);
      CI.lastGame(g.slug);
      document.getElementById('crumb').textContent = g.title;
      render();
      var t = state.target && document.getElementById('c-' + state.target);
      if (t) t.scrollIntoView({ block: 'center' });
    }).catch(function () {
      document.getElementById('crumb').textContent = 'Couldn’t load';
      showState('error', 'This cheat list didn’t load.', 'Check your connection and try again. If it keeps failing, the file may be missing from the site.',
        el('button', { class: 'btn', type: 'button', text: 'Try again', onclick: load }));
    });
  }
  window.addEventListener('hashchange', function () {
    route = parseRoute();
    state.cat = 'All'; state.copied = null; state.q = ''; state.target = route.cheat; state.practice = null; load();
  });
  load();
})();

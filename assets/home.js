// Home page: game grid, search, sort, platform filter, selected-game panel.
(function () {
  var el = CI.el;
  var state = { games: [], sort: 'new', platform: 'All', q: '', selected: null, index: {} };
  var $ = function (id) { return document.getElementById(id); };
  var gridState = $('grid-state');

  function setStatus(kind, title, body, action) {
    gridState.innerHTML = '';
    if (!kind) return;
    var box = el('div', { class: kind === 'loading' ? 'state' : 'empty' }, [
      el('p', { text: title }),
      body ? el('p', { text: body }) : null
    ]);
    if (kind === 'loading') box.appendChild(el('div', { class: 'bars', 'aria-hidden': 'true' }, [el('div'), el('div'), el('div')]));
    if (action) box.appendChild(action);
    gridState.appendChild(box);
  }

  // Search across titles, example codes, and (once loaded) every cheat's effect and codes.
  function matches(g, q) {
    if (!q) return { hit: true, cheats: 0 };
    var head = (g.title + ' ' + g.short + ' ' + g.year + ' ' + g.methods.join(' ') + ' ' + (g.sample || '')).toLowerCase();
    var n = 0;
    (state.index[g.slug] || []).forEach(function (s) { if (s.indexOf(q) !== -1) n++; });
    return { hit: head.indexOf(q) !== -1 || n > 0, cheats: n };
  }

  var SORTS = [['new', 'Newest'], ['old', 'Oldest'], ['az', 'A–Z'], ['most', 'Most cheats']];
  var PLATS = ['All', 'PC', 'PlayStation', 'Xbox', 'Handheld'];
  var cmp = {
    new: function (a, b) { return b.order - a.order; },
    old: function (a, b) { return a.order - b.order; },
    az: function (a, b) { return a.title.localeCompare(b.title); },
    most: function (a, b) { return (b.count - a.count) || (b.order - a.order); }
  };

  function tabs(target, items, current, onPick) {
    var box = $(target);
    box.innerHTML = '';
    items.forEach(function (it) {
      var id = Array.isArray(it) ? it[0] : it, label = Array.isArray(it) ? it[1] : it;
      box.appendChild(el('button', { class: 'tab', type: 'button', 'data-fk': target + ':' + id, 'aria-pressed': String(id === current), text: label, onclick: function () { onPick(id); } }));
    });
  }

  function renderSelected() {
    var g = state.games.filter(function (x) { return x.slug === state.selected; })[0];
    var box = $('selected');
    if (!g) { box.hidden = true; return; }
    box.hidden = false;
    $('sel-art').innerHTML = '';
    $('sel-art').appendChild(CI.cover(g, true));
    $('sel-year').textContent = g.year;
    $('sel-title').textContent = g.title;
    $('sel-method').textContent = g.methods.join(' · ');
    $('sel-count').textContent = CI.countText(g);
    $('sel-platforms').textContent = g.platforms.join(', ');
    var act = $('sel-actions');
    act.innerHTML = '';
    if (g.pending) {
      act.appendChild(el('p', { style: 'margin:0;font-weight:500', text: 'No cheats are confirmed for ' + g.short + ' yet.' }));
    } else {
      act.appendChild(el('a', { class: 'btn-primary', href: 'game.html#' + g.slug, text: 'See all ' + g.count + ' ' + g.short + ' cheats' }));
      if (g.sample) act.appendChild(el('span', { class: 'muted', style: 'font-size:15px' }, ['Example: ', el('span', { class: 'mono', style: 'font-weight:600;color:var(--ink)', text: g.sample })]));
    }
  }

  function render() {
    var fk = CI.focusKey();
    draw();
    CI.restoreFocus(document.getElementById('main'), fk);
  }

  function draw() {
    tabs('sorts', SORTS, state.sort, function (v) { state.sort = v; render(); });
    tabs('filters', PLATS, state.platform, function (v) { state.platform = v; render(); });
    var q = state.q.trim().toLowerCase();
    var shown = state.games
      .filter(function (g) { return state.platform === 'All' || g.platforms.indexOf(state.platform) !== -1; })
      .map(function (g) { var m = matches(g, q); return { g: g, m: m }; })
      .filter(function (x) { return x.m.hit; })
      .sort(function (a, b) { return cmp[state.sort](a.g, b.g); });

    $('game-count').textContent = shown.length + ' of ' + state.games.length;
    $('search-note').textContent = q ? shown.length + (shown.length === 1 ? ' game matches.' : ' games match.') : 'Matches game titles, cheat effects and codes.';
    $('clear-q').hidden = !state.q;

    var grid = $('grid');
    grid.innerHTML = '';
    if (!shown.length) {
      var where = state.platform === 'All' ? '' : ' on ' + state.platform;
      setStatus('empty', q ? 'Nothing matches “' + state.q.trim() + '”' + where + '.' : 'No games' + where + '.', 'Try another spelling, or show every platform.',
        el('button', { class: 'btn', type: 'button', text: 'Clear search and filters', onclick: function () { state.q = ''; $('q').value = ''; state.platform = 'All'; render(); $('q').focus(); } }));
    } else setStatus(null);

    shown.forEach(function (x) {
      var g = x.g;
      var label = g.title + ', ' + g.year + ', ' + g.methods.join(', ') + ', ' + CI.countText(g) + ' cheats' + (q && x.m.cheats ? ', ' + x.m.cheats + ' matching cheats' : '');
      grid.appendChild(el('li', null, [el('button', {
        class: 'card', type: 'button', 'data-fk': 'card:' + g.slug, 'aria-pressed': String(g.slug === state.selected), 'aria-label': label,
        onclick: function () { state.selected = g.slug; CI.lastGame(g.slug); render(); if (window.innerWidth < 700) $('selected').scrollIntoView({ block: 'start' }); }
      }, [
        CI.cover(g, false),
        el('span', null, [
          el('span', { class: 'year', text: String(g.year) }),
          el('span', { class: 'name', text: g.title }),
          el('span', { class: 'meta' }, [el('span', { text: g.methods.join(' · ') }), el('b', { text: CI.countText(g) })]),
          q && x.m.cheats ? el('span', { class: 'match', text: x.m.cheats + (x.m.cheats === 1 ? ' matching cheat' : ' matching cheats') }) : null
        ])
      ])]));
    });
    renderSelected();
  }

  // The cheat search index is built on the first search, so visitors who only browse
  // don't download every game file.
  var indexing = false;
  function buildIndex() {
    if (indexing) return;
    indexing = true;
    state.games.forEach(function (g) {
      if (g.pending) return;
      CI.getJSON('data/' + g.slug + '.json').then(function (full) {
        state.index[g.slug] = full.cheats.map(function (c) {
          var codes = Object.keys(c.codes).map(function (k) { return c.codes[k]; }).join(' ');
          return (c.effect + ' ' + c.category + ' ' + codes).toLowerCase();
        });
        if (state.q) render();
      }).catch(function () {});
    });
  }

  $('q').addEventListener('input', function (e) {
    state.q = e.target.value;
    if (state.q.trim() && state.games.length) buildIndex();
    render();
  });
  $('clear-q').addEventListener('click', function () { state.q = ''; $('q').value = ''; render(); $('q').focus(); });
  $('search-form').addEventListener('submit', function (e) { e.preventDefault(); });

  function load() {
    setStatus('loading', 'Loading games…');
    CI.getJSON('data/games.json').then(function (d) {
      state.games = d.games;
      // Open on the visitor's last pick, if it's still in the list. First visit: nothing
      // selected, so the panel stays hidden until a cover is clicked.
      if (!state.selected) {
        var last = CI.lastGame();
        if (d.games.some(function (g) { return g.slug === last; })) state.selected = last;
      }
      if (state.q.trim()) buildIndex();
      render();
    }).catch(function () {
      setStatus('empty', 'The game list didn’t load.', 'Check your connection and try again. If it keeps failing, the data file may be missing from the site.',
        el('button', { class: 'btn', type: 'button', text: 'Try again', onclick: load }));
    });
  }
  load();
})();

// Game page: loads data/<slug>.json from game.html#<slug> (or ?g=<slug>) and renders the cheat list.
(function () {
  var el = CI.el;
  var page = document.getElementById('page');
  var slug = location.hash.slice(1) || new URLSearchParams(location.search).get('g') || '';
  var state = { game: null, input: null, cat: 'All', copied: null };

  function showState(kind, title, body, action) {
    page.innerHTML = '';
    var box = el('div', { class: 'state', role: kind === 'error' ? 'alert' : 'status', 'aria-busy': kind === 'loading' ? 'true' : null }, [
      el('h2', { text: title }), body ? el('p', { text: body }) : null
    ]);
    if (kind === 'loading') box.appendChild(el('div', { class: 'bars', 'aria-hidden': 'true' }, [el('div'), el('div'), el('div')]));
    if (action) box.appendChild(action);
    page.appendChild(box);
  }

  function codeFor(c, input) {
    var v = c.codes[input.derive || input.id];
    return v || null;
  }

  function copyText(c, input) {
    var v = codeFor(c, input);
    if (!v) return '';
    return input.type === 'combo' ? CI.comboWords(v, input.pad) : v;
  }

  function codeCell(c, input) {
    var v = codeFor(c, input);
    if (!v) return el('span', { class: 'na', text: 'Not on ' + input.label });
    if (input.type === 'combo') return CI.renderCombo(v, input.pad);
    return el('span', { class: 'code', text: v });
  }

  function render() {
    var g = state.game, input = state.input;
    page.innerHTML = '';

    var facts = el('dl', { class: 'facts' }, [
      el('div', null, [el('dt', { text: 'Input type' }), el('dd', { text: g.methods.join(' · ') })]),
      el('div', null, [el('dt', { text: 'Cheats' }), el('dd', { class: 'big', text: CI.countText(g) })]),
      el('div', null, [el('dt', { text: 'Platforms' }), el('dd', { class: 'plain', text: g.platforms.join(', ') })]),
      el('div', null, [el('dt', { text: 'Released' }), el('dd', { class: 'plain mono', text: String(g.year) })])
    ]);
    page.appendChild(el('div', { class: 'game-head' }, [
      el('div', { class: 'art' }, [CI.cover(g, true)]),
      el('div', { class: 'info' }, [el('h1', { text: g.title }), facts])
    ]));

    if (g.pending || !g.cheats.length) {
      page.appendChild(el('div', { class: 'state' }, [
        el('h2', { text: 'No ' + g.short + ' cheats are confirmed yet.' }),
        el('p', { text: g.warning || 'This page fills in once codes are confirmed in the game.' })
      ]));
      return;
    }

    // Platform switch and how-to.
    var seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'plat-l', style: '--n:' + g.inputs.length });
    g.inputs.forEach(function (inp) {
      seg.appendChild(el('button', { type: 'button', 'aria-pressed': String(inp.id === input.id), text: inp.label,
        onclick: function () { state.input = inp; state.copied = null; render(); } }));
    });
    page.appendChild(el('div', { class: 'howto' }, [
      el('div', { class: 'pick' }, [el('div', { class: 'h', id: 'plat-l', text: 'Show codes for' }), seg]),
      el('div', { class: 'text' }, [el('div', { class: 'h', text: 'How to enter' }), el('p', { text: input.how }), g.warning ? el('p', { class: 'warn', text: g.warning }) : null])
    ]));

    // Category tabs.
    var cats = ['All'];
    g.cheats.forEach(function (c) { if (cats.indexOf(c.category) === -1) cats.push(c.category); });
    var rows = g.cheats.filter(function (c) { return state.cat === 'All' || c.category === state.cat; });
    var avail = rows.filter(function (c) { return codeFor(c, input); }).length;
    var tabBox = el('div', { class: 'tabs', role: 'group', 'aria-label': 'Category' });
    cats.forEach(function (cat) {
      tabBox.appendChild(el('button', { class: 'tab', type: 'button', 'aria-pressed': String(cat === state.cat), text: cat, onclick: function () { state.cat = cat; render(); } }));
    });

    var list = el('ul', { class: 'cheats' });
    rows.forEach(function (c, i) {
      var id = c.effect + '|' + i;
      var copyable = !!codeFor(c, input);
      list.appendChild(el('li', { class: 'cheat' }, [
        el('span', { class: 'eff', text: c.effect }),
        el('span', { class: 'cat', text: c.category }),
        el('span', { class: 'code-cell' }, [codeCell(c, input)]),
        el('span', { class: 'copy' }, [copyable ? el('button', { class: 'btn', type: 'button', 'aria-label': 'Copy code for ' + c.effect,
          text: state.copied === id ? 'Copied' : 'Copy',
          onclick: function () {
            var t = copyText(c, input);
            try { navigator.clipboard.writeText(t); } catch (e) {}
            state.copied = id; render();
            document.getElementById('announce').textContent = 'Copied the code for ' + c.effect + '.';
          } }) : null]),
        c.requirement ? el('p', { class: 'req' }, [el('b', { text: 'Requirement: ' }), c.requirement]) : null,
        c.note ? el('p', { class: 'note', text: c.note }) : null
      ]));
    });

    var codeHead = input.type === 'combo' ? input.label + ' combo' : input.type === 'phone' ? 'Phone number' : input.type === 'phrase' ? 'Phrase' : input.label + ' code';
    page.appendChild(el('section', { class: 'list', 'aria-label': 'Cheat list' }, [
      el('div', { class: 'top' }, [tabBox, el('span', { class: 'muted', style: 'font-size:14px', text: rows.length + ' of ' + g.cheats.length + ' cheats, ' + avail + ' on ' + input.label })]),
      el('div', { class: 'cheat-head', 'aria-hidden': 'true' }, [el('span', { text: 'Effect' }), el('span', { text: 'Category' }), el('span', { text: codeHead }), el('span')]),
      list,
      el('p', { class: 'sr', 'aria-live': 'polite', id: 'announce' }),
      g.incomplete ? el('p', { class: 'muted', style: 'margin-top:20px', text: 'This list isn’t complete yet. More codes are coming.' }) : null,
      el('p', { class: 'muted', style: 'margin-top:24px;font-size:15px' }, ['Wrong or missing code? ', el('a', { href: 'https://github.com/NBDBatman/Rockstar-Cheat-Index/issues', text: 'Open an issue' }), ' or a pull request on GitHub. Each game is one JSON file.']),
      g.sources && g.sources.length ? el('div', { class: 'sources' }, [
        el('span', { text: 'Checked against:' }),
        el('ul', null, g.sources.map(function (s) { return el('li', null, [el('a', { href: s, rel: 'noopener', text: s.replace(/^https?:\/\/(www\.)?/, '') })]); }))
      ]) : null
    ]));
  }

  function load() {
    if (!/^[a-z0-9-]+$/.test(slug)) {
      document.getElementById('crumb').textContent = 'Not found';
      showState('error', 'That game isn’t in the index.', 'Pick a game from the list instead.', el('a', { class: 'btn-primary', href: './', text: 'Back to all games' }));
      return;
    }
    showState('loading', 'Loading cheats…');
    CI.getJSON('data/' + slug + '.json').then(function (g) {
      state.game = g;
      state.input = g.inputs[0] || null;
      document.title = g.title + ' cheats | Cheat Index';
      document.getElementById('crumb').textContent = g.title;
      render();
    }).catch(function () {
      document.getElementById('crumb').textContent = 'Couldn’t load';
      showState('error', 'This cheat list didn’t load.', 'Check your connection and try again. If it keeps failing, the file may be missing from the site.',
        el('button', { class: 'btn', type: 'button', text: 'Try again', onclick: load }));
    });
  }
  window.addEventListener('hashchange', function () { slug = location.hash.slice(1); state.cat = 'All'; load(); });
  load();
})();

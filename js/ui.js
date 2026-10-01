'use strict';
/* Amtsschimmel – Oberfläche: Kopfzeile, Laufband, Reiter, Haushalt, Dialoge, Meldungen. */
(function (root) {
  const AS = root.AS;
  const U = AS.U, D = AS.D, C = AS.Core, A = AS.Audio;
  const UI = (AS.UI = {});
  const $ = (id) => document.getElementById(id);
  const ic = (n) => '<span data-icon="' + n + '">' + AS.ICON(n) + '</span>';
  const esc = U.esc;
  const f = (n, o) => U.fmt(n, o);
  const costHTML = (n, can, icon) => '<span class="cost' + (can ? '' : ' no') + '">' + ic(icon || 'akte') + f(n) + '</span>';
  const wide = () => window.matchMedia('(min-width: 1180px)').matches;
  const compact = () => window.matchMedia('(max-width: 759px)').matches;
  const setT = (el, t) => { if (el && el._t !== t) { el._t = t; el.textContent = t; } };
  const setH = (el, h) => { if (el && el._h !== h) { el._h = h; el.innerHTML = h; } };

  let tab = 'amt', lastSig = {}, shopSig = '', upOpen = false, openInfo = {};
  const news = {};

  /* ---------- Hilfen ---------- */
  UI.announce = (t) => { const el = $('srLive'); el.textContent = ''; setTimeout(() => { el.textContent = t; }, 30); };
  UI.toast = function (o) {
    const host = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (o.cls || '');
    el.innerHTML = ic(o.icon || 'akte') + '<div>' + (o.kicker ? '<div class="t-kicker">' + esc(o.kicker) + '</div>' : '') +
      '<div class="t-title">' + esc(o.title || '') + '</div>' + (o.text ? '<div class="t-text">' + esc(o.text) + '</div>' : '') + '</div>';
    el.addEventListener('click', () => { if (o.onClick) o.onClick(); close(); });
    if (o.onClick) el.style.cursor = 'pointer';
    host.appendChild(el);
    while (host.children.length > 4) host.firstChild.remove();
    const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 300); };
    setTimeout(close, o.ms || 5200);
    UI.announce((o.kicker ? o.kicker + ': ' : '') + (o.title || '') + '. ' + (o.text || ''));
  };
  UI.modal = function (html, opts) {
    opts = opts || {};
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = '<div class="modal ' + (opts.cls || '') + '" role="dialog" aria-modal="true">' + (opts.noClose ? '' : '<button class="close" type="button" aria-label="Schließen">' + AS.ICON('zu') + '</button>') + html + '</div>';
    $('modalRoot').appendChild(back);
    const m = back.querySelector('.modal');
    const prev = document.activeElement;
    const close = () => { back.remove(); if (prev && prev.focus) prev.focus(); if (opts.onClose) opts.onClose(); };
    back.addEventListener('click', (e) => {
      if (e.target === back && !opts.noClose) close();
      if (e.target.closest('.close') || e.target.closest('[data-close]')) close();
    });

    setTimeout(() => { const fb = m.querySelector('[autofocus]') || m.querySelector('button.btn') || m.querySelector('button'); if (fb) fb.focus(); }, 20);
    return { el: m, close };
  };
  UI.confirm = function (title, text, okLabel, onOk, danger) {
    // Fokus bewusst auf „Abbrechen“: Die Leertaste aus Stempel-Gewohnheit soll nichts bestätigen
    const md = UI.modal('<h2>' + esc(title) + '</h2><div>' + text + '</div><div class="modal-actions"><button class="btn" type="button" data-close autofocus>Abbrechen</button><button class="btn ' + (danger ? 'primary' : 'blue') + '" type="button" data-ok>' + esc(okLabel) + '</button></div>');
    md.el.querySelector('[data-ok]').addEventListener('click', () => { md.close(); onOk(); });
  };

  /* ---------- Reiter ---------- */
  const TABS = [
    { id: 'amt', name: 'Amtsstube', icon: 'amt' },
    { id: 'shop', name: 'Haushalt', icon: 'akte', compact: true },
    { id: 'paras', name: 'Paragrafen', icon: 'para', unlock: () => C.paraUnlocked() },
    { id: 'album', name: 'Formulare', icon: 'album', unlock: (S) => Object.keys(S.forms).length > 0 },
    { id: 'reform', name: 'Reform', icon: 'reform', unlock: (S) => S.stats.reforms > 0 || C.djGain() > 0 || S.dj > 0 },
    { id: 'urkunden', name: 'Urkunden', icon: 'urkunde' },
    { id: 'stats', name: 'Statistik', icon: 'stats' },
    { id: 'optionen', name: 'Optionen', icon: 'optionen' },
  ];
  const tabVisible = (t) => { const S = C.get(); return (!t.compact || !wide()) && (!t.unlock || t.unlock(S) || S.flags['tab_' + t.id]); };
  function renderTabs() {
    const S = C.get();
    const vis = TABS.filter(tabVisible);
    vis.forEach((t) => { if (t.unlock && !S.flags['tab_' + t.id]) { S.flags['tab_' + t.id] = true; news[t.id] = true; } });
    if (!vis.find((t) => t.id === tab)) { tab = 'amt'; document.body.dataset.ptab = tab; lastSig.panel = ''; placeShop(); }
    const sig = vis.map((t) => t.id + (news[t.id] ? '*' : '')).join(',') + tab;
    if (sig === lastSig.tabs) return;
    lastSig.tabs = sig;
    $('tabs').innerHTML = vis.map((t) => '<button class="tab' + (news[t.id] ? ' has-news' : '') + '" role="tab" type="button" aria-selected="' + (t.id === tab) + '" data-action="tab" data-tab="' + t.id + '">' + ic(t.icon) + '<span>' + t.name + '</span><span class="dot"></span></button>').join('');
    renderNav();
  }
  const NAV = [
    { id: 'desk', name: 'Schreibtisch', icon: 'stempel' },
    { id: 'shop', name: 'Haushalt', icon: 'akte' },
    { id: 'paras', name: 'Paragrafen', icon: 'para' },
    { id: 'album', name: 'Formulare', icon: 'album' },
    { id: 'reform', name: 'Reform', icon: 'reform' },
    { id: 'mehr', name: 'Mehr', icon: 'amt' },
  ];
  function renderNav() {
    const S = C.get();
    const view = document.body.dataset.view;
    const items = NAV.filter((n) => { const t = TABS.find((x) => x.id === n.id); return !t || tabVisible(t); });
    const cur = view === 'desk' ? 'desk' : (['amt', 'urkunden', 'stats', 'optionen'].indexOf(tab) >= 0 ? 'mehr' : tab);
    news.desk = view !== 'desk' && !!(S.anliegen.cur || (S.korb.doc && S.korb.doc.type === 'eilt'));
    const sig = items.map((n) => n.id + (news[n.id] || (n.id === 'mehr' && (news.urkunden || news.amt)) ? '*' : '')).join(',') + cur;
    if (sig === lastSig.nav) return;
    lastSig.nav = sig;
    $('mobileNav').innerHTML = items.map((n) => '<button type="button" data-action="nav" data-nav="' + n.id + '" aria-current="' + (n.id === cur) + '" class="' + (news[n.id] ? 'has-news' : '') + '">' + ic(n.icon) + '<span>' + n.name + '</span><span class="dot"></span></button>').join('');
  }
  UI.setTab = function (id) {
    tab = id;
    news[id] = false;
    document.body.dataset.ptab = id;
    if (compact()) document.body.dataset.view = 'panel';
    lastSig.tabs = ''; lastSig.nav = '';
    lastSig.panel = '';
    placeShop();
    renderTabs();
    renderPanel(true);
    $('panelBody').scrollTop = 0;
  };
  function placeShop() {
    const shop = $('shop');
    if (wide()) { if (shop.parentElement !== $('colShop')) $('colShop').appendChild(shop); }
    else if (tab === 'shop') { if (shop.parentElement !== $('panelBody')) { $('panelBody').innerHTML = ''; $('panelBody').appendChild(shop); } }
    else if (shop.parentElement === $('panelBody')) $('colShop').appendChild(shop);
  }

  /* ---------- Kopfzeile, Zähler, Laufband ---------- */
  function updateTop() {
    const S = C.get(), M = C.M;
    const e = D.ERAS[S.era];
    setT($('eraYear'), e.place + ' · ' + e.year);
    setT($('eraName'), e.name);
    const p = U.fmtParts(S.akten);
    setT($('cntAkten'), p.num);
    setT($('cntWord'), p.word ? p.word + ' Akten' : (Math.floor(S.akten) === 1 ? 'Akte' : 'Akten'));
    setT($('cntSps'), f(M.sps, { dec: 1 }));
    const bx = M.prodBuff * M.chaos;
    setT($('cntBuff'), Math.abs(bx - 1) > 0.001 ? U.mult(bx) : '');
    $('cntVBox').hidden = !(S.vor > 0 || M.vps > 0);
    setT($('cntV'), f(S.vor, { dec: 1 }));
    setT($('cntVps'), f(M.vps, { dec: 2 }));
    setT($('miniAkten'), f(S.akten));
    setT($('miniSps'), '+' + f(M.sps, { dec: 1 }) + '/s');
  }
  function updateSoundBtns() {
    const st = C.get().settings;
    $('btnSound').innerHTML = AS.ICON(st.sound ? 'ton' : 'tonaus');
    $('btnMusic').innerHTML = AS.ICON(st.music && st.sound ? 'musik' : 'musikaus');
    $('btnSound').setAttribute('aria-pressed', String(st.sound));
    $('btnMusic').setAttribute('aria-pressed', String(st.music));
  }
  let tickX = 0, tickW = 0, tickNext = 0;
  function nextNews() {
    const S = C.get();
    const pool = D.NEWS.any.concat(D.NEWS[S.era] || [], D.NEWS[S.era] || []);
    const dyn = [];
    if (S.stats.docs > 50) dyn.push('Rekord: ' + f(S.stats.docs) + ' Vorgänge erledigt. Die Registratur bittet um Mäßigung.');
    if (S.korb.pending.length > 2) dyn.push(S.korb.pending.length + ' Widersprüche liegen im Eingang. Die Widerspruchsstelle wirkt gestresst.');
    if (S.stats.schimmel > 0) dyn.push('Der Amtsschimmel wurde bisher ' + f(S.stats.schimmel) + '-mal gesichtet und eingefangen. Er bestreitet das.');
    const fl = C.projState('flughafen');
    if (fl.delays > 0 && !fl.done) dyn.push('Flughafen Schilda-Süd: Eröffnung zum ' + (fl.delays + 1) + '. Mal verschoben. Grund: ' + D.PROJ.flughafen.delayNames[fl.delays - 1] + '.');
    if (S.dj > 0) dyn.push('Personalnachricht: Die Belegschaft blickt auf ' + f(S.dj) + ' Dienstjahre zurück.');
    const all = pool.concat(dyn, dyn);
    return U.pick(all);
  }
  function updateTicker(dt) {
    if (!C.get().settings.ticker) return;
    const el = $('tickerText');
    const track = el.parentElement;
    if (!tickW || tickX < -tickW - 20) {
      el.textContent = nextNews();
      tickW = el.offsetWidth;
      tickX = track.offsetWidth + 10;
    }
    tickX -= dt * 70;
    el.style.transform = 'translate(' + tickX.toFixed(1) + 'px,-50%)';
  }

  /* ---------- Haushalt ---------- */
  function upIcon(u) {
    if (u.kind === 'tier') return AS.ICON(u.gen) + '<span class="tierno">' + U.roman(u.tier + 1) + '</span>';
    if (u.kind === 'syn') return AS.ICON(u.fx[0].id) + '<span class="tierno">+</span>';
    if (u.kind === 'trad') return AS.ICON('schreiber') + '<span class="tierno">★</span>';
    const map = { st: 'stempel', zs: 'amt', fl: 'fluss', ei: 'eilt', wi: 'widerspruch', fo: 'album', sc: 'schimmelKopf', gr: 'ausschuss', gl: 'kaffee', am: 'arbeitskreis' };
    return AS.ICON(map[u.id.slice(0, 2)] || 'stern');
  }
  function buyAmt() { const a = C.get().settings.buyAmt; return a === 'max' ? 'max' : Number(a) || 1; }
  function genCostFor(id, isGrem) {
    const amt = buyAmt();
    if (amt === 'max') {
      const n = isGrem ? C.maxBuyGrem(id) : C.maxBuy(id);
      return { n: Math.max(1, n), cost: isGrem ? C.gremCost(id, Math.max(1, n)) : C.genCost(id, Math.max(1, n)) };
    }
    return { n: amt, cost: isGrem ? C.gremCost(id, amt) : C.genCost(id, amt) };
  }
  function shopStructure() {
    const S = C.get();
    const gens = D.GENS.filter((g) => C.genUnlocked(g) || S.gens[g.id]);
    const next = D.GENS.find((g) => !C.genUnlocked(g) && !S.gens[g.id]);
    const grem = D.GREMIEN.filter((g) => S.era >= g.era || S.grem[g.id]);
    const ups = C.availableUpgrades();
    return { gens, next, grem, ups };
  }
  function renderShop(force) {
    const S = C.get(), M = C.M;
    const st = shopStructure();
    const shown = upOpen ? st.ups : st.ups.slice(0, 6);
    const sig = st.gens.map((g) => g.id).join() + '|' + (st.next ? st.next.id : '') + '|' + st.grem.map((g) => g.id).join() + '|' + shown.map((u) => u.id).join() + '|' + st.ups.length + '|' + S.settings.buyAmt + '|' + Object.keys(openInfo).filter((k) => openInfo[k]).join();
    const host = $('shop');
    if (force || sig !== shopSig) {
      shopSig = sig;
      const amt = S.settings.buyAmt;
      let h = '<div class="shop-head"><h2 class="sec">' + ic('akte') + 'Haushalt</h2><div class="amt-toggle" role="group" aria-label="Kaufmenge">' +
        [1, 10, 100, 'max'].map((a) => '<button type="button" data-action="amt" data-amt="' + a + '" aria-pressed="' + (String(amt) === String(a)) + '">' + (a === 'max' ? 'Max' : a) + '</button>').join('') + '</div></div>';
      h += '<h3 class="sec">' + ic('stern') + 'Verbesserungen <span class="right"><span id="upAfford"></span> <button class="btn small" type="button" data-action="buyAllUps" id="btnAllUps">Alle kaufen</button></span></h3>';
      if (!st.ups.length) h += '<p class="muted small">Gerade keine Verbesserungen verfügbar. Stell mehr Personal ein – dann tauchen neue auf.</p>';
      h += '<div class="up-list">' + shown.map((u) => '<button type="button" class="up-row" data-action="buyUp" data-id="' + u.id + '"><span class="up-ic">' + upIcon(u) + '</span><span><span class="up-name">' + esc(u.name) + '</span><span class="up-desc">' + esc(u.desc) + (u.flavor ? ' <i>' + esc(u.flavor) + '</i>' : '') + '</span></span><span class="up-cost" data-cost="' + u.id + '"></span></button>').join('') + '</div>';
      if (st.ups.length > 6) h += '<div class="up-more"><button class="btn small wide" type="button" data-action="upMore">' + (upOpen ? 'Weniger anzeigen' : 'Alle ' + st.ups.length + ' anzeigen') + '</button></div>';
      h += '<h3 class="sec">' + ic('schreiber') + 'Personal & Technik</h3><div>';
      h += st.gens.map((g) => '<div class="gen-row" data-action="buyGen" data-id="' + g.id + '" role="button" tabindex="0" aria-label="' + esc(g.name) + ' kaufen">' +
        '<span class="gen-ic">' + AS.ICON(g.id) + '</span><span class="gen-main"><span class="gen-name">' + esc(g.name) + '</span><span class="gen-meta" data-meta="' + g.id + '"></span><span class="gen-cost" data-gcost="' + g.id + '"></span></span>' +
        '<span class="gen-n" data-gn="' + g.id + '"></span><button class="gen-info" type="button" data-action="info" data-id="' + g.id + '" aria-label="Details zu ' + esc(g.name) + '">' + AS.ICON('info') + '</button>' +
        (openInfo[g.id] ? '<div class="gen-desc">' + esc(g.desc) + '<span class="stat" data-gstat="' + g.id + '"></span></div>' : '') + '</div>').join('');
      if (st.next) h += '<div class="gen-row locked"><span class="gen-ic">' + AS.ICON('schloss') + '</span><span class="gen-main"><span class="gen-name">???</span><span class="gen-meta">Ab der Epoche „' + esc(D.ERAS[st.next.era].name) + '“</span></span><span></span></div>';
      h += '</div>';
      if (st.grem.length) {
        h += '<h3 class="sec">' + ic('ausschuss') + 'Gremien <span class="right muted">erzeugen Vorschriften (§)</span></h3><div>';
        h += st.grem.map((g) => '<div class="gen-row" data-action="buyGrem" data-id="' + g.id + '" role="button" tabindex="0" aria-label="' + esc(g.name) + ' gründen">' +
          '<span class="gen-ic">' + AS.ICON(g.id) + '</span><span class="gen-main"><span class="gen-name">' + esc(g.name) + '</span><span class="gen-meta" data-vmeta="' + g.id + '"></span><span class="gen-cost" data-vcost="' + g.id + '"></span></span>' +
          '<span class="gen-n" data-vn="' + g.id + '"></span><button class="gen-info" type="button" data-action="info" data-id="' + g.id + '" aria-label="Details zu ' + esc(g.name) + '">' + AS.ICON('info') + '</button>' +
          (openInfo[g.id] ? '<div class="gen-desc">' + esc(g.desc) + '</div>' : '') + '</div>').join('');
        h += '</div>';
      }
      host.innerHTML = h;
    }
    // Werte aktualisieren
    const g0 = M.staticG * M.rechts * M.chaos * M.prodBuff;
    let afford = 0;
    for (const u of shown) {
      const el = host.querySelector('[data-cost="' + u.id + '"]');
      if (!el) continue;
      const c = C.upCost(u), can = c <= S.akten;
      setH(el, costHTML(c, can));
      el.parentElement.classList.toggle('afford', can);
    }
    for (const u of st.ups) if (C.upCost(u) <= S.akten) afford++;
    setT($('upAfford'), afford ? afford + ' bezahlbar' : '');
    const ab = $('btnAllUps'); if (ab) ab.disabled = !afford;
    const total = M.sps || 1;
    for (const g of st.gens) {
      const n = S.gens[g.id] || 0;
      const { n: k, cost } = genCostFor(g.id);
      const can = cost <= S.akten && (buyAmt() !== 'max' || C.maxBuy(g.id) > 0);
      const row = host.querySelector('[data-id="' + g.id + '"].gen-row');
      if (!row) continue;
      row.classList.toggle('afford', can);
      row.classList.toggle('boost', !!(M.genBuff && M.genBuff[g.id]));
      const each = M.unit[g.id] * g0;
      const share = (M.genSps[g.id] || 0) / total;
      setH(host.querySelector('[data-meta="' + g.id + '"]'), '+' + f(each, { dec: 1 }) + '/s je Stück' + (n ? ' · ' + f(M.genSps[g.id] || 0, { dec: 1 }) + '/s (' + U.pct(share) + ')<span class="share" style="width:' + Math.round(share * 40) + 'px"></span>' : ''));
      setH(host.querySelector('[data-gcost="' + g.id + '"]'), ic('akte') + f(cost) + (k > 1 ? ' <small>für ' + k + '</small>' : ''));
      setT(host.querySelector('[data-gn="' + g.id + '"]'), n ? String(n) : '');
      const stat = host.querySelector('[data-gstat="' + g.id + '"]');
      if (stat) setT(stat, 'Grundleistung ' + f(g.prod, { dec: 1 }) + '/s · Multiplikator ' + U.mult(M.unit[g.id] / g.prod) + ' · Kategorie ' + ({ person: 'Personal', sache: 'Sachmittel', technik: 'Technik' })[g.cat]);
    }
    for (const g of st.grem) {
      const n = S.grem[g.id] || 0;
      const { n: k, cost } = genCostFor(g.id, true);
      const can = cost <= S.akten && (buyAmt() !== 'max' || C.maxBuyGrem(g.id) > 0);
      const row = host.querySelector('[data-id="' + g.id + '"].gen-row');
      if (!row) continue;
      row.classList.toggle('afford', can);
      const each = g.vps * M.F.vX * M.parkinson;
      setH(host.querySelector('[data-vmeta="' + g.id + '"]'), '+' + f(each, { dec: 2 }) + ' §/s je Gremium');
      setH(host.querySelector('[data-vcost="' + g.id + '"]'), ic('akte') + f(cost) + (k > 1 ? ' <small>für ' + k + '</small>' : ''));
      setT(host.querySelector('[data-vn="' + g.id + '"]'), n ? String(n) : '');
    }
  }

  /* ---------- Panels ---------- */
  const P = {};

  P.amt = {
    sig: (S) => S.era + '|' + S.leitbild + '|' + D.PROJECTS.filter((p) => C.projVisible(p.id)).map((p) => p.id + C.projState(p.id).stage + C.projState(p.id).delays + C.projState(p.id).done).join() + '|' + (C.djGain() >= 1) + '|' + S.finale.done + '|' + compact(),
    render(S) {
      const e = D.ERAS[S.era];
      const lb = D.LB[S.leitbild];
      let h = '';
      if (compact()) h += '<div class="mobile-more">' + ['amt', 'urkunden', 'stats', 'optionen'].map((id) => { const t = TABS.find((x) => x.id === id); return '<button class="btn" type="button" data-action="tab" data-tab="' + id + '">' + ic(t.icon) + t.name + '</button>'; }).join('') + '</div>';
      h += '<h2 class="sec">' + ic('amt') + 'Amtsstube</h2>';
      h += '<div class="card era-card"><div class="era-meta">' + esc(e.place) + ' · ' + esc(e.year) + ' · Epoche ' + (S.era + 1) + ' von ' + D.ERAS.length + '</div><div class="era-big">' + esc(e.name) + '</div>' +
        '<div class="timeline">' + D.ERAS.map((x, i) => '<i class="' + (i < S.era ? 'on' : i === S.era ? 'now' : '') + '" title="' + esc(x.name) + '"></i>').join('') + '</div>' +
        '<p class="era-text">' + esc(e.text) + '</p><div id="amtNextEra"></div></div>';
      if (C.djGain() >= 1) h += '<div class="card" style="border-left:5px solid var(--red)"><b>Eine Verwaltungsreform ist möglich.</b><p class="small">Du würdest <b id="amtDjGain"></b> Dienstjahre erhalten. <button class="btn small primary" type="button" data-action="tab" data-tab="reform">Zur Reform</button></p></div>';
      h += '<h3 class="sec">' + ic('reform') + 'Leitbild: ' + esc(lb.name) + '</h3><div class="card"><div class="lb-motto" style="font-family:var(--font-serif);font-style:italic">' + esc(lb.motto) + '</div><p class="small">' + esc(lb.desc) + '</p>' +
        (lb.pro.length || lb.con.length ? '<ul class="small" style="margin:0;padding-left:18px">' + lb.pro.map((x) => '<li style="color:#1d5e33">' + esc(x) + '</li>').join('') + lb.con.map((x) => '<li style="color:#7f1d1d">' + esc(x) + '</li>').join('') + '</ul>' : '') +
        (S.streak && lb.id !== 'kameral' ? '<p class="small" style="color:#7f1d1d">Reformmüdigkeit: Produktion ×' + U.dec(C.M.muede, 2) + ', weil du dieses Leitbild ' + (S.streak + 1) + '-mal hintereinander gewählt hast.</p>' : '') + '</div>';
      const projs = D.PROJECTS.filter((p) => C.projVisible(p.id) || (p.finale && S.finale.done));
      if (projs.length) {
        h += '<h3 class="sec">' + ic('flugzeug') + 'Großprojekte</h3>';
        for (const p of projs) {
          if (p.finale && S.finale.done) { h += '<div class="card proj-card"><b>' + esc(p.name) + '</b> – <span class="chip ok">erledigt</span><p class="small">Die Verwaltung verwaltet sich jetzt selbst. Produktion dauerhaft ×2. <button class="btn small" type="button" data-action="finaleAgain">Finale ansehen</button></p></div>'; continue; }
          const ps = C.projState(p.id);
          const stages = p.stages.map((s, i) => '<i class="' + (ps.done || i < ps.stage ? 'on' : (p.delays && i === p.stages.length - 1 && ps.delays ? 'delay' : '')) + '" title="' + esc(s.name) + '"></i>').join('');
          const ready = p.finale ? C.portalReady() : { ok: true, reasons: [] };
          h += '<div class="card proj-card"><div style="display:flex;gap:8px;align-items:center">' + ic(p.finale ? 'knopf' : 'flugzeug') + '<b>' + esc(p.name) + '</b>' + (ps.done ? ' <span class="chip ok">eröffnet</span>' : '') + (ps.delays && !ps.done ? ' <span class="chip red">' + ps.delays + '× verschoben</span>' : '') + '</div>' +
            '<p class="small">' + esc(p.desc) + '</p><div class="proj-stages">' + stages + '</div>' +
            (ps.done ? '<p class="small">Belohnung erhalten: ' + esc(p.reward) + '</p>'
              : (ready.ok ? '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="small">Nächster Schritt: <b>' + esc(C.projStageName(p.id)) + '</b></span><button class="btn small primary" type="button" data-action="fund" data-id="' + p.id + '" id="fund_' + p.id + '"></button></div><p class="small muted">Belohnung: ' + esc(p.reward) + '</p>'
                : '<p class="small">Voraussetzungen: ' + ready.reasons.map(esc).join(', ') + '.</p>')) + '</div>';
        }
      }
      h += '<h3 class="sec">' + ic('stern') + 'Nächste Ziele</h3><div class="card goal-list" id="amtGoals"></div>';
      h += '<h3 class="sec">' + ic('info') + 'Dienstanweisung</h3><div class="card small help">' + HELP + '</div>';
      return h;
    },
    update(S, host) {
      const nx = C.nextEraAt();
      const el = $('amtNextEra');
      if (el) setH(el, nx ? '<div class="small">Nächste Epoche „<b>' + esc(D.ERAS[S.era + 1].name) + '</b>“ ab ' + f(nx) + ' Akten in diesem Durchgang</div><div class="bar"><i style="width:' + U.clamp(Math.log10(1 + S.runAkten) / Math.log10(1 + nx) * 100, 0, 100) + '%"></i></div>' : '<div class="small">Die letzte Epoche ist erreicht.</div>');
      const dg = $('amtDjGain'); if (dg) setT(dg, f(C.djGain()));
      for (const p of D.PROJECTS) {
        const b = $('fund_' + p.id);
        if (!b) continue;
        const c = C.projCost(p.id);
        setH(b, ic('akte') + f(c) + ' bereitstellen');
        b.disabled = c > S.akten;
      }
      const goals = $('amtGoals');
      if (goals) {
        const g = [];
        if (nx) g.push(['amt', 'Epoche „' + D.ERAS[S.era + 1].name + '“', S.runAkten / nx]);
        const up = C.availableUpgrades()[0];
        if (up) g.push(['stern', 'Verbesserung „' + up.name + '“', S.akten / C.upCost(up)]);
        const gen = D.GENS.find((x) => C.genUnlocked(x) && !S.gens[x.id]);
        if (gen) g.push([gen.id, D.erste(gen, true), S.akten / C.genCost(gen.id)]);
        if (S.dj > 0 || C.djGain() > 0 || S.totalAkten > 1e9) g.push(['dj', 'Nächstes Dienstjahr', Math.pow(S.totalAkten / C.nextDjAt(), 1 / 3)]);
        if (S.era >= 9 && !S.finale.done) g.push(['knopf', 'Der Ein-Klick-Antrag', C.portalReady().ok ? S.akten / C.projCost('portal') : 0]);
        setH(goals, g.map(([i, t, p]) => '<div class="goal">' + ic(i) + '<span style="min-width:130px">' + esc(t) + '</span><div class="bar"><i style="width:' + U.clamp(p * 100, 0, 100) + '%"></i></div><small>' + Math.floor(U.clamp(p, 0, 1) * 100) + ' %</small></div>').join('') || '<span class="muted small">Alles erreicht. Die Verwaltung ist vollendet.</span>');
      }
    },
  };

  P.shop = { sig: () => 'shop', render: () => '', update: () => {} };

  const HELP = [
    ['Stempeln', 'Ein Klick auf die Akte (oder die Leertaste) ist der <b>Eingangsstempel</b>: kleiner Ertrag, fünf Stempel schließen einen Vorgang ab. Ab Rom gibt es <b>Ressortstempel</b> (Tasten 1–6): Der zuständige Stempel bringt viel mehr und baut <b>Arbeitsfluss</b> auf. Der falsche erzeugt einen <b>Widerspruch</b> – er kommt wieder, braucht dann zwei Stempel und kostet dich den Arbeitsfluss. Ein kleiner Bonus federt das ab, aber Sorgfalt lohnt sich immer.'],
    ['Sonderfälle', '<b>EILT</b>-Vorgänge haben eine Frist und bringen rechtzeitig erledigt einen dicken Bonus. Ab der Kaiserzeit gibt es <b>Mitzeichnungen</b>, die nacheinander drei Ressorts brauchen.'],
    ['Haushalt', 'Personal und Technik arbeiten auch ohne dich. Verbesserungen vervielfachen ihre Leistung. Mit „1 / 10 / 100 / Max“ stellst du die Kaufmenge ein.'],
    ['Gremien & Paragrafen', 'Gremien beschließen Vorschriften (§). Mit ihnen setzt du Paragrafen in Kraft. Gesparte Vorschriften steigern die Produktion und vermehren sich selbst – sparen oder ausgeben, das ist hier die Frage.'],
    ['Glück & Kundschaft', 'Der <b>Amtsschimmel</b> galoppiert ab und zu vorbei: anklicken! <b>Bürgeranliegen</b> am Schalter haben mehrere Antworten mit eigenen Folgen. Beim Abschließen von Vorgängen findest du manchmal <b>Formulare</b> für dein Album.'],
    ['Reform', 'Eine <b>Verwaltungsreform</b> setzt den Durchgang zurück und bringt Dienstjahre (dauerhaft mehr Produktion) und Pensionspunkte für die <b>Laufbahn</b>. Jedes Leitbild ändert die Regeln. Ziel ist der Ein-Klick-Antrag im Weltamt.'],
    ['Abwesenheit', 'Während du weg bist, arbeitet die Urlaubsvertretung mit verminderter Leistung weiter. Die Laufbahn kann das verbessern. Der Spielstand wird automatisch gespeichert; unter Optionen kannst du ihn exportieren.'],
  ].map(([t, x]) => '<details><summary><b>' + t + '</b></summary><p>' + x + '</p></details>').join('');

  P.paras = {
    sig: (S) => Object.keys(S.paras).join() + '|' + D.PARAS.filter((p) => C.paraState(p) === 'open').map((p) => p.id).join() + '|' + S.novelle,
    render(S) {
      let h = '<h2 class="sec">' + ic('para') + 'Paragrafen</h2>';
      h += '<div class="para-head"><div class="stat"><b id="pV"></b><span>Vorschriften</span></div><div class="stat"><b id="pVps"></b><span>pro Sekunde</span></div><div class="stat"><b id="pPark"></b><span>Parkinson-Faktor</span></div><div class="stat"><b id="pRechts"></b><span>Vorschriften-Bonus auf Produktion</span></div></div>';
      h += '<p class="small muted">Gremien beschließen Vorschriften. Mit ihnen setzt du Paragrafen in Kraft – sie gelten bis zur nächsten Reform. Angesammelte Vorschriften steigern die Produktion und vermehren sich selbst (Parkinson): Sparen oder ausgeben?</p>';
      for (const t of D.TEILE) {
        h += '<div class="para-teil"><h3 class="sec">' + esc(t.name) + '</h3><div class="para-list">';
        for (const p of D.PARAS.filter((x) => x.teil === t.id)) {
          const stt = C.paraState(p);
          h += '<div class="para-row ' + stt + '"><span class="para-no">§ ' + p.no + '</span><span><span class="para-name">' + esc(p.name) + '</span><br><span class="para-desc">' + esc(p.desc) + '</span></span>' +
            (stt === 'owned' ? '<span class="chip ok">' + ic('haken') + 'in Kraft</span>' : stt === 'locked' ? '<span class="chip">' + ic('schloss') + '§ ' + D.PARA[p.req].no + '</span>' : '<button class="btn small blue" type="button" data-action="buyPara" data-id="' + p.id + '" data-pcost="' + p.id + '"></button>') + '</div>';
        }
        h += '</div></div>';
      }
      if (C.novelleOpen()) {
        h += '<h3 class="sec">' + ic('para') + 'Gesetzesnovellen</h3><div class="card"><p class="small">Das Gesetzbuch ist vollständig – aber eine Verwaltung ist nie fertig. Jede Novelle steigert die Produktion in diesem Durchgang um 10 %. Bisher: <b>' + S.novelle + '</b> Novellen (×' + U.dec(Math.pow(C.NOVELLE_X, S.novelle), 2) + ').</p><button class="btn small blue" type="button" data-action="buyNovelle" id="btnNovelle"></button></div>';
      } else if (Object.keys(S.paras).length >= 30) {
        h += '<p class="small muted">Wenn alle 36 Paragrafen in Kraft sind, lassen sich Gesetzesnovellen beschließen.</p>';
      }
      return h;
    },
    update(S, host) {
      const M = C.M;
      const bn = $('btnNovelle');
      if (bn) { const c = C.novelleCost(); setH(bn, ic('para') + f(c, { dec: 1 }) + ' – nächste Novelle'); bn.disabled = c > S.vor; }
      setT($('pV'), f(S.vor, { dec: 1 }));
      setT($('pVps'), f(M.vps, { dec: 2 }));
      setT($('pPark'), M.F.noParkinson ? 'aus' : U.mult(M.parkinson));
      setT($('pRechts'), U.mult(M.rechts));
      host.querySelectorAll('[data-pcost]').forEach((b) => {
        const p = D.PARA[b.dataset.pcost];
        const c = C.paraCost(p);
        setH(b, ic('para') + f(c, { dec: 1 }) + ' erlassen');
        b.disabled = c > S.vor;
      });
    },
  };

  P.album = {
    sig: (S) => Object.entries(S.forms).map(([k, v]) => k + v).join(),
    render(S) {
      const found = Object.keys(S.forms).length;
      let bonus = 0;
      for (const id in S.forms) bonus += D.RARITY[D.FORM[id].r].bonus;
      const dup = C.duplicateForms();
      let h = '<h2 class="sec">' + ic('album') + 'Formular-Album <span class="right">' + found + ' / ' + D.FORMS.length + '</span></h2>';
      h += '<p class="small muted">Beim Abschließen von Vorgängen tauchen manchmal Formulare auf. Sie bleiben für immer – auch nach einer Reform. Jedes neue Formular steigert die Produktion (zurzeit +' + U.pct(bonus, 1) + '), jeder volle Ordner gibt einen Sonderbonus.</p>';
      h += '<div class="card" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' + ic('altpapier') + '<span class="small"><b>' + dup + '</b> doppelte Formulare</span><button class="btn small" type="button" data-action="altpapier"' + (dup ? '' : ' disabled') + '>Dubletten ins Altpapier (+' + f(Math.max(100, C.M.spsBase * 120) * dup) + ' Akten)</button></div>';
      for (const o of D.ORDNER) {
        const list = D.FORMS.filter((x) => x.ordner === o.id);
        const have = list.filter((x) => S.forms[x.id]).length;
        const done = have === list.length;
        h += '<div class="ordner"><div class="ordner-head">' + ic('akte') + esc(o.name) + ' <small class="muted">' + have + '/' + list.length + '</small><span class="set">' + (done ? '<span class="chip ok">' + esc(o.set) + '</span>' : '<span class="chip">Komplett: ' + esc(o.set) + '</span>') + '</span></div><div class="form-grid">';
        h += list.map((x) => {
          const r = D.RARITY[x.r];
          if (!S.forms[x.id]) return '<div class="form-card missing ' + r.cls + '"><span><span class="rar">' + r.name + '</span>???' + (x.era > S.maxEra ? '<br><small>spätere Epoche</small>' : '') + (x.special ? '<br><small>Sonderfund</small>' : '') + '</span></div>';
          return '<div class="form-card ' + r.cls + '" title="' + esc(x.name) + '"><span class="rar">' + r.name + ' · +' + U.pct(r.bonus, 1) + '</span>' + esc(x.name) + (S.forms[x.id] > 1 ? '<span class="cnt">×' + S.forms[x.id] + '</span>' : '') + '</div>';
        }).join('');
        h += '</div></div>';
      }
      return h;
    },
    update() {},
  };

  let selLb = null;
  P.reform = {
    sig: (S) => S.stats.reforms + '|' + (C.djGain() >= 1) + '|' + selLb + '|' + Object.keys(S.perks).join() + '|' + S.stufe + '|' + D.LEITBILDER.filter((l) => C.leitbildUnlocked(l.id)).length + '|' + D.PERKS.map((p) => C.perkState(p)).join(''),
    render(S) {
      const can = C.djGain() >= 1;
      let h = '<h2 class="sec">' + ic('reform') + 'Verwaltungsreform</h2>';
      h += '<div class="reform-box"><div class="dj-row"><div class="dj-big">' + ic('dj') + '<span id="rDj"></span></div><div class="small"><b>Dienstjahre</b><br>Produktion <b id="rDjMult"></b></div>' +
        '<div class="dj-big" style="font-size:22px">' + ic('pp') + '<span id="rPp"></span></div><div class="small"><b>Pensionspunkte</b><br>für deine Laufbahn</div></div>' +
        '<p class="small">Eine Reform setzt Akten, Personal, Gremien, Verbesserungen, Paragrafen, Großprojekte und Epoche zurück. Dafür gibt es Dienstjahre (je +' + U.pct(C.CONST.DJ_EFFECT * C.M.F.djX, 1) + ' Produktion, für immer) und genauso viele Pensionspunkte. Formulare, Urkunden, Laufbahn und Statistik bleiben.</p>' +
        '<p><b>Reform jetzt:</b> +<span id="rGain"></span> Dienstjahre · nächstes bei <span id="rNext"></span> Akten insgesamt (bisher <span id="rTotal"></span>)</p></div>';
      h += '<h3 class="sec">' + ic('amt') + 'Leitbild für den nächsten Durchgang</h3><p class="small muted">Das erste Mal in einem neuen Leitbild gibt dauerhaft +5 % Produktion. Dasselbe Leitbild mehrmals hintereinander macht reformmüde (−15 % je Wiederholung).</p><div class="lb-grid">';
      for (const l of D.LEITBILDER) {
        const un = C.leitbildUnlocked(l.id);
        if (l.secret && !un) continue;
        const req = !un ? (l.id === 'buerger' ? 3 : l.id === 'npm' ? 4 : l.id === 'entbuer' ? 5 : l.id === 'digital' ? 6 : 7) : 0;
        const tag = !S.visited[l.id] ? '<span class="chip ok lb-tag">neu: +5 %</span>' : (l.id === S.leitbild && l.id !== 'kameral' ? '<span class="chip red lb-tag">müde</span>' : (l.id === S.leitbild ? '<span class="chip lb-tag">aktuell</span>' : ''));
        h += '<button type="button" class="lb-card' + (selLb === l.id ? ' sel' : '') + (un ? '' : ' locked') + '" data-action="selLb" data-id="' + l.id + '"' + (un ? '' : ' disabled') + '>' + (un ? tag : '<span class="chip lb-tag">' + ic('schloss') + 'Epoche ' + (req + 1) + '</span>') +
          '<span class="lb-name">' + esc(l.name) + '</span><span class="lb-motto">' + esc(l.motto) + '</span>' +
          (un ? '<ul>' + l.pro.map((x) => '<li class="pro">' + esc(x) + '</li>').join('') + l.con.map((x) => '<li class="con">' + esc(x) + '</li>').join('') + '</ul>' : '<span class="small muted">Wird freigeschaltet, sobald du die Epoche „' + esc(D.ERAS[req].name) + '“ erreicht hast.</span>') + '</button>';
      }
      h += '</div><div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn primary" type="button" data-action="reform" id="btnReform"' + (can && selLb ? '' : ' disabled') + '>' + ic('reform') + 'Reform durchführen</button><span class="small muted">' + (can ? (selLb ? '' : 'Wähle zuerst ein Leitbild.') : 'Noch nicht genug Akten für ein neues Dienstjahr.') + '</span></div>';
      h += '<h2 class="sec" style="margin-top:18px">' + ic('laufbahn') + 'Laufbahn <span class="right">' + ic('pp') + '<span id="rPp2"></span> Pensionspunkte</span></h2><p class="small muted">Laufbahnstufen gelten für immer. Für die nächste Laufbahn brauchst du drei Stufen der vorherigen.</p><div class="perk-cols">';
      for (const lb of D.LAUFBAHNEN) {
        h += '<div class="perk-col"><h4>' + esc(lb.name) + '</h4>';
        for (const p of D.PERKS.filter((x) => x.lb === lb.id)) {
          const stt = C.perkState(p);
          h += '<div class="perk ' + stt + '"><span><span class="perk-name">' + esc(p.name) + '</span><br><span class="perk-desc">' + esc(p.desc) + (p.req && stt === 'locked' && !S.perks[p.req] ? ' (erfordert ' + esc(D.PERK[p.req].name) + ')' : '') + '</span></span>' +
            (stt === 'owned' ? '<span class="chip ok">' + ic('haken') + '</span>' : '<button class="btn small blue" type="button" data-action="buyPerk" data-id="' + p.id + '" data-kcost="' + p.cost + '"' + (stt === 'open' ? '' : ' disabled') + '>' + ic('pp') + f(p.cost) + '</button>') + '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
      const allPerks = D.PERKS.every((p) => S.perks[p.id]);
      h += '<div class="card" style="margin-top:10px"><b>Erfahrungsstufe ' + S.stufe + '</b> <span class="small muted">– jede Stufe: Produktion ×1,1 (zurzeit ×' + U.dec(Math.pow(1.1, S.stufe), 2) + ')</span><br>' +
        '<button class="btn small blue" type="button" data-action="buyStufe" id="btnStufe" style="margin-top:6px">' + ic('pp') + f(C.stufeCost()) + ' – nächste Stufe</button>' + (allPerks ? '' : ' <span class="small muted">Lohnt sich vor allem, wenn die Laufbahn komplett ist.</span>') + '</div>';
      return h;
    },
    update(S) {
      setT($('rDj'), f(S.dj));
      setT($('rDjMult'), U.mult(C.M.djMult));
      setT($('rPp'), f(S.pp)); setT($('rPp2'), f(S.pp));
      setT($('rGain'), f(C.djGain()));
      setT($('rNext'), f(C.nextDjAt()));
      setT($('rTotal'), f(S.totalAkten));
      document.querySelectorAll('[data-kcost]').forEach((b) => { if (C.perkState(D.PERK[b.dataset.id]) === 'open') b.disabled = S.pp < Number(b.dataset.kcost); });
      const bs = $('btnStufe'); if (bs) bs.disabled = S.pp < C.stufeCost();
    },
  };

  P.urkunden = {
    sig: (S) => Object.keys(S.ach).length,
    render(S) {
      const n = Object.keys(S.ach).length;
      let h = '<h2 class="sec">' + ic('urkunde') + 'Urkunden <span class="right">' + n + ' / ' + D.ACH.length + '</span></h2><p class="small muted">Jede Urkunde steigert die Produktion um 1 % (zurzeit +' + n + ' %). Einige sind geheim.</p><div class="ach-grid">';
      h += D.ACH.map((a) => {
        const own = !!S.ach[a.id];
        if (!own && a.secret) return '<div class="ach off secret">' + ic('schloss') + '<span><b>Geheim</b>???</span></div>';
        return '<div class="ach' + (own ? '' : ' off') + '" title="' + esc(a.desc) + '">' + ic('urkunde') + '<span><b>' + esc(a.name) + '</b>' + esc(a.desc) + '</span></div>';
      }).join('');
      return h + '</div>';
    },
    update() {},
  };

  P.stats = {
    sig: () => 'stats',
    render() { return '<h2 class="sec">' + ic('stats') + 'Statistik</h2><table class="stats-table"><tbody id="statsBody"></tbody></table>'; },
    update(S) {
      const st = S.stats, M = C.M;
      const rows = [
        ['Akten insgesamt (alle Durchgänge)', f(S.totalAkten)], ['Akten in diesem Durchgang', f(S.runAkten)], ['Produktion pro Sekunde', f(M.sps, { dec: 1 })],
        ['Höchste Produktion', f(st.maxSps, { dec: 1 })], ['Wert eines Eingangsstempels', f(M.clickVal, { dec: 1 })], ['Wert eines Ressortstempels', f(M.stampVal, { dec: 1 })],
        ['Vorschriften insgesamt', f(S.totalVor, { dec: 1 })], ['Eingangsstempel', f(st.clicks)], ['Richtige Ressortstempel', f(st.correct)], ['Falsche Stempel', f(st.wrong)],
        ['Stempel der Vertretung', f(st.auto)], ['Vorgänge erledigt', f(st.docs)], ['EILT rechtzeitig / versäumt', f(st.eilt) + ' / ' + f(st.eiltMissed)],
        ['Widersprüche erledigt', f(st.wider)], ['Mitzeichnungen', f(st.gross)], ['Höchster Arbeitsfluss', f(st.maxFlow)], ['Amtsschimmel gefangen / entwischt', f(st.schimmel) + ' / ' + f(st.schimmelMissed)],
        ['Bürgeranliegen', f(st.anliegen)], ['Formulare gefunden (mit Dubletten)', f(st.formsFound)], ['Verwaltungsreformen', f(st.reforms)], ['Dienstjahre', f(S.dj)],
        ['Bester Durchgang', f(st.bestRun)], ['Offline erarbeitet', f(st.offlineAkten)], ['Spielzeit', U.fmtTime(st.playTime)], ['Dieser Durchgang', U.fmtTime(S.run.gt)],
        ['Urkunden', Object.keys(S.ach).length + ' / ' + D.ACH.length], ['Leitbilder erlebt', Object.keys(S.visited).map((k) => D.LB[k].name).join(', ')],
      ];
      setH($('statsBody'), rows.map(([a, b]) => '<tr><td>' + esc(a) + '</td><td>' + esc(b) + '</td></tr>').join(''));
    },
  };

  P.optionen = {
    sig: (S) => JSON.stringify(S.settings) + Object.keys(S.perks).filter((k) => /automatik/.test(k)).join() + S.lastBackup + C.readOnly,
    render(S) {
      const st = S.settings;
      const sw = (key, label, desc) => '<div class="opt-row"><label for="sw_' + key + '">' + label + (desc ? '<br><small class="muted">' + desc + '</small>' : '') + '</label><button class="switch" id="sw_' + key + '" type="button" role="switch" aria-checked="' + !!st[key] + '" data-action="toggle" data-key="' + key + '"></button></div>';
      let h = '<h2 class="sec">' + ic('optionen') + 'Optionen</h2>';
      h += '<h3 class="sec">Klang</h3>' + sw('sound', 'Ton') + sw('music', 'Warteschleifenmusik', 'Generativ, passend zur Epoche') +
        '<div class="opt-row"><label for="volSfx">Lautstärke Geräusche</label><input id="volSfx" type="range" min="0" max="1" step="0.05" value="' + st.sfxVol + '" data-action="vol" data-key="sfxVol"></div>' +
        '<div class="opt-row"><label for="volMus">Lautstärke Musik</label><input id="volMus" type="range" min="0" max="1" step="0.05" value="' + st.musicVol + '" data-action="vol" data-key="musicVol"></div>' +
        '<div class="opt-row"><label>Warteschleifenansage<br><small class="muted">Eine Durchsage, wie man sie vom Bürgertelefon kennt</small></label><button class="btn small" type="button" data-action="ansage">' + ic('telefon') + 'Abspielen</button></div>';
      h += '<h3 class="sec">Anzeige</h3><div class="opt-row"><label for="selFmt">Zahlenformat</label><select id="selFmt" data-action="fmt"><option value="kurz"' + (st.numFmt === 'kurz' ? ' selected' : '') + '>Kurz (1,23 Mio.)</option><option value="lang"' + (st.numFmt === 'lang' ? ' selected' : '') + '>Ausgeschrieben (1,23 Millionen)</option><option value="wiss"' + (st.numFmt === 'wiss' ? ' selected' : '') + '>Wissenschaftlich (1,23e6)</option></select></div>' +
        '<div class="opt-row"><label for="selMotion">Bewegung</label><select id="selMotion" data-action="motion"><option value="auto"' + (st.motion === 'auto' ? ' selected' : '') + '>Wie im System eingestellt</option><option value="voll"' + (st.motion === 'voll' ? ' selected' : '') + '>Alle Animationen</option><option value="wenig"' + (st.motion === 'wenig' ? ' selected' : '') + '>Wenig Bewegung</option></select></div>' +
        sw('ticker', 'Amtsblatt-Laufband') + sw('tips', 'Tipps des Amtsschimmels');
      if (S.perks.haushaltsautomatik || S.perks.personalautomatik) {
        h += '<h3 class="sec">Automatik</h3>';
        if (S.perks.haushaltsautomatik) h += sw('autoUp', 'Haushaltsautomatik', 'Kauft bezahlbare Verbesserungen');
        if (S.perks.personalautomatik) h += sw('autoGen', 'Personalautomatik', 'Kauft Generatoren und Gremien');
      }
      h += '<h3 class="sec">Spielstand</h3><p class="small muted">Der Spielstand wird alle 15 Sekunden in diesem Browser gespeichert, dazu alle 10 Minuten eine Sicherungskopie.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" type="button" data-action="saveNow">Jetzt speichern</button><button class="btn small" type="button" data-action="export">Exportieren</button><button class="btn small" type="button" data-action="import">Importieren</button><button class="btn small" type="button" data-action="download">Als Datei sichern</button></div>';
      const bk = C.listBackups();
      if (bk.length) h += '<p class="small" style="margin-top:10px"><b>Sicherungskopien</b></p>' + bk.map((b) => '<div class="opt-row"><label>' + esc(new Date(b.t).toLocaleString('de-DE')) + '<br><small class="muted">' + f(b.total) + ' Akten insgesamt</small></label><button class="btn small" type="button" data-action="restore" data-key="' + esc(b.key) + '">Wiederherstellen</button></div>').join('');
      h += '<div class="opt-row" style="margin-top:8px"><label>Alles löschen<br><small class="muted">Setzt das Spiel komplett zurück. Nicht umkehrbar.</small></label><button class="btn small primary" type="button" data-action="reset">Zurücksetzen</button></div>';
      h += '<h3 class="sec">Über das Spiel</h3><p class="small">Amtsschimmel – ein Verwaltungs-Idle-Game. Alle Grafiken sind Inline-SVG, alle Klänge werden live im Browser erzeugt, es werden keine externen Dateien oder Schriften geladen. Tastatur: <kbd>Leertaste</kbd> Eingangsstempel, <kbd>1</kbd>–<kbd>6</kbd> Ressortstempel, <kbd>B</kbd> alle Verbesserungen kaufen, <kbd>M</kbd> Ton, <kbd>Esc</kbd> Dialog schließen.</p><p class="small muted">Version ' + C.VERSION + ' · Alle Personen, Orte und Behörden sind frei erfunden. Ähnlichkeiten mit real existierenden Verwaltungsvorgängen sind unvermeidlich.</p>';
      return h;
    },
    update() {},
  };

  function renderPanel(force) {
    placeShop();
    if (tab === 'shop') return;
    const S = C.get();
    const p = P[tab];
    const host = $('panelBody');
    const sig = tab + ':' + p.sig(S);
    if (force || sig !== lastSig.panel) {
      lastSig.panel = sig;
      const st = host.scrollTop;
      host.innerHTML = p.render(S);
      host.scrollTop = st;
    }
    p.update(S, host);
  }
  UI.refresh = () => { lastSig = {}; shopSig = ''; renderTabs(); renderPanel(true); renderShop(true); };

  /* ---------- Dialoge ---------- */
  function eraModal(e) {
    const era = D.ERAS[e.era];
    const gens = D.GENS.filter((g) => g.era === e.era).concat(D.GREMIEN.filter((g) => g.era === e.era));
    const rs = D.ERAS[e.era].ressorts - D.ERAS[e.era - 1].ressorts;
    UI.modal('<div class="era-year-big">' + esc(era.place) + ' · ' + esc(era.year) + '</div><h2>' + esc(era.name) + '</h2><p class="era-text">' + esc(era.text) + '</p>' +
      '<div class="new-list">' + gens.map((g) => '<span>' + ic(g.id) + esc(g.name) + '</span>').join('') + (rs > 0 ? D.RESSORTS.slice(D.ERAS[e.era - 1].ressorts, D.ERAS[e.era].ressorts).map((r) => '<span>' + ic('r_' + r.id) + 'Ressort ' + esc(r.short) + '</span>').join('') : '') + '</div>' +
      '<div class="modal-actions" style="justify-content:center"><button class="btn primary" type="button" data-close autofocus>Weiter verwalten</button></div>', { cls: 'era-modal' });
  }
  function offlineModal(r) {
    if (!r || r.gain <= 0) return;
    UI.modal('<h2>' + ic('uhr') + ' Willkommen zurück!</h2><p>Während deiner Abwesenheit (' + esc(U.fmtTime(r.sec)) + ') hat die Urlaubsvertretung weitergearbeitet:</p>' +
      '<p style="font-family:var(--font-serif);font-size:22px;font-weight:700">+' + esc(f(r.gain)) + ' Akten' + (r.vGain > 0 ? '<br><span style="font-size:16px">+' + esc(f(r.vGain, { dec: 1 })) + ' Vorschriften</span>' : '') + '</p>' +
      '<p class="small muted">Offline-Ertrag: ' + U.pct(r.eff) + ' der Produktion' + (r.capped ? ', angerechnet höchstens ' + U.fmtTime(r.t) : '') + '. Die Laufbahn kann beides verbessern.</p>' +
      '<div class="modal-actions"><button class="btn primary" type="button" data-close autofocus>An die Arbeit</button></div>');
  }
  UI.loadInfo = function (info) {
    if (info.problem === 'corrupt') UI.modal('<h2>Spielstand beschädigt</h2><p>Der gespeicherte Spielstand ließ sich nicht lesen. ' + (info.restored ? 'Er wurde aus der Sicherungskopie vom ' + esc(new Date(info.restored.t).toLocaleString('de-DE')) + ' wiederhergestellt.' : 'Es wurde ein neues Spiel begonnen.') + ' Die beschädigte Fassung ist im Browser aufbewahrt.</p><div class="modal-actions"><button class="btn primary" type="button" data-close>Verstanden</button></div>');
    else if (info.problem === 'future') UI.modal('<h2>Neuere Spielversion</h2><p>Dein Spielstand stammt aus einer neueren Version des Spiels. Damit er nicht überschrieben wird, ist das Speichern in dieser Sitzung abgeschaltet. Bitte lade die Seite neu (notfalls mit Strg+F5), um die aktuelle Version zu erhalten.</p><div class="modal-actions"><button class="btn primary" type="button" data-close>Verstanden</button></div>');
    else if (info.offline) offlineModal(info.offline);
    else if (info.fresh) introModal();
  };
  UI.offlineReport = function (r) {
    if (document.querySelector('.modal-back')) return;
    offlineModal(r);
  };
  function introModal() {
    UI.modal('<div style="display:flex;gap:12px;align-items:center"><span style="width:84px;flex:none">' + AS.ICONS.schimmelKopf + '</span><h2 style="margin:0">Willkommen im Amt!</h2></div>' +
      '<p style="font-family:var(--font-serif);font-size:16px">Ur, 2100 vor Christus. In der Tempelverwaltung ritzt ein Schreiber die erste Quittung der Menschheit in Ton. Du bist zuständig.</p>' +
      '<p>Stemple Akten ab, stell Personal ein, gründe Gremien, erlasse Paragrafen und führe die Verwaltung durch viertausend Jahre – bis zu dem einen Antrag, der alle anderen überflüssig macht.</p>' +
      '<p class="small muted">Tipp: Kopfhörer auf, Ton an. Der Amtsschimmel hilft dir unterwegs mit Hinweisen.</p>' +
      '<div class="modal-actions"><button class="btn primary" type="button" data-close autofocus>' + ic('stempel') + 'Dienst antreten</button></div>', { onClose: () => A.unlock() });
  }
  function reformConfirm() {
    const S = C.get();
    const l = D.LB[selLb];
    const gain = C.djGain();
    const keepI = C.M.F.flags.keepI, keepAll = C.M.F.flags.keepAll;
    UI.confirm('Verwaltungsreform', '<p>Neues Leitbild: <b>' + esc(l.name) + '</b>' + (S.visited[l.id] ? '' : ' <span class="chip ok">neu: +5 % für immer</span>') + (selLb === S.leitbild && selLb !== 'kameral' ? ' <span class="chip red">Reformmüdigkeit</span>' : '') + '</p>' +
      '<p>Du erhältst <b>' + f(gain) + ' Dienstjahre</b> und <b>' + f(gain) + ' Pensionspunkte</b>.</p>' +
      '<p class="small">Zurückgesetzt werden: Akten, Personal & Technik, Gremien, Vorschriften, Verbesserungen, ' + (keepAll ? '' : keepI ? 'Paragrafen (außer Teil I), ' : 'Paragrafen, ') + 'Großprojekte und die Epoche.<br>Erhalten bleiben: Dienstjahre, Laufbahn, Formulare, Urkunden und Statistik.</p>', 'Reform durchführen', () => {
      const r = C.reform(selLb);
      if (!r) return;
      selLb = null;
      A.reform();
      document.body.dataset.era = C.get().era;
      A.setEra(C.get().era);
      AS.Desk.reset();
      UI.refresh();
      UI.toast({ icon: 'reform', kicker: 'Verwaltungsreform', title: 'Leitbild: ' + D.LB[r.lb].name, text: '+' + f(r.gain) + ' Dienstjahre. ' + (r.firstVisit ? 'Neues Leitbild: +5 % Produktion für immer!' : ''), cls: 'blue' });
      AS.Main.save();
    }, true);
  }

  /* ---------- Finale ---------- */
  UI.finale = function (replay) {
    const S = C.get();
    const el = document.createElement('div');
    el.className = 'finale';
    el.innerHTML = '<div><div style="width:120px;margin:0 auto 10px">' + AS.ICONS.schimmelKopf + '</div><h2>Der Ein-Klick-Antrag</h2><p>Viertausend Jahre Verwaltung. Tontafeln, Siegel, Kanzleien, Hängeregistraturen, Rohrpost, Durchschläge, Faxe, Großrechner und E-Akten. Alles läuft auf diesen Moment zu.</p><p>Ein einziger Knopf. Ein Antrag. Sofort bewilligt.</p><button class="big-button" type="button" id="finBtn">Antrag stellen</button></div>';
    document.body.appendChild(el);
    A.fanfare();
    el.querySelector('#finBtn').addEventListener('click', () => {
      A.stamp('correct', 40); A.bell();
      el.innerHTML = '<div><h2>BEWILLIGT</h2><p>Der Antrag wurde in 0,0001 Sekunden bearbeitet und bewilligt. Die Verwaltung hat ihr Ziel erreicht.</p><p>Bitte warten Sie. Der Bescheid wird gedruckt …</p><div class="printout" id="finPrint"></div></div>';
      A.printer();
      const host = el.querySelector('#finPrint');
      const now = new Date(C.now()).toLocaleDateString('de-DE');
      ['Ausfertigung 1 von 3', 'Ausfertigung 2 von 3 (Durchschlag)', 'Ausfertigung 3 von 3 (für die Akten)'].forEach((t, i) => setTimeout(() => {
        const d = document.createElement('div');
        d.innerHTML = '<b>BESCHEID</b> – ' + esc(t) + '<br>Az. Ω-1/' + now + '<br>Ihr Antrag wurde bewilligt.<br><small>Gegen diesen Bescheid kann innerhalb eines Monats Widerspruch eingelegt werden.</small>';
        host.appendChild(d);
        A.printer();
        if (i === 2) setTimeout(credits, 1600);
      }, 900 + i * 1300));
    });
    function credits() {
      const st = S.stats;
      el.innerHTML = '<div><div style="width:150px;margin:0 auto">' + AS.ICONS.schimmel + '</div><h2>Abspann</h2><p class="credits">Die Verwaltung verwaltet sich jetzt selbst.<br>' +
        f(S.totalAkten) + ' Akten · ' + f(st.docs) + ' Vorgänge · ' + f(st.reforms) + ' Reformen · ' + f(st.schimmel) + '-mal den Amtsschimmel gefangen<br>' +
        Object.keys(S.ach).length + ' Urkunden · ' + Object.keys(S.forms).length + ' Formulare · Spielzeit ' + esc(U.fmtTime(st.playTime)) + '</p>' +
        '<p>Ab jetzt gilt dauerhaft: Produktion ×2. Die Ewige Behörde arbeitet weiter – mit allen Urkunden, Formularen und Erfahrungsstufen, die noch warten.</p>' +
        '<p class="credits">Gestaltung, Programmierung, Klang: alles aus einer Hand – frei nach dem Leitbild Zentralismus.<br>Mit Dank an alle Sachbearbeiterinnen und Sachbearbeiter, die jeden Tag dafür sorgen, dass es läuft.</p>' +
        '<button class="btn primary" type="button" id="finClose">Weiter verwalten</button></div>';
      el.querySelector('#finClose').addEventListener('click', () => { el.remove(); S.finale.seen = true; UI.refresh(); AS.Main.save(); });
    }
  };

  /* ---------- Ereignisse ---------- */
  function hookEvents() {
    U.on('era', (e) => {
      const S = C.get();
      A.setEra(e.era);
      document.body.dataset.era = e.era;
      AS.Desk.reset();
      if (S.maxEra === e.era && !S.flags['eraSeen' + e.era] && e.old !== undefined && D.ERAS[e.old]) { S.flags['eraSeen' + e.era] = true; A.fanfare(); eraModal(e); }
      else UI.toast({ icon: 'amt', kicker: 'Neue Epoche', title: D.ERAS[e.era].name, text: D.ERAS[e.era].place + ', ' + D.ERAS[e.era].year });
    });
    U.on('ach', (a) => { A.ach(); UI.toast({ icon: 'urkunde', kicker: 'Urkunde verliehen', title: a.name, text: a.desc + ' (+1 % Produktion)', cls: 'gold' }); news.urkunden = true; });
    U.on('form', (r) => {
      A.form(r.form.r);
      if (r.isNew) { UI.toast({ icon: 'album', kicker: 'Neues Formular · ' + D.RARITY[r.form.r].name, title: r.form.name, text: '+' + U.pct(D.RARITY[r.form.r].bonus, 1) + ' Produktion' + (C.isOrdnerComplete(r.form.ordner) ? ' · Ordner komplett!' : ''), cls: r.form.r === 'l' ? 'gold' : 'green' }); news.album = true; }
      else AS.Desk.floater('Formular (doppelt)', innerWidth / 2, innerHeight / 2, 'v');
    });
    U.on('buy', () => A.buy());
    U.on('buyGrem', () => A.buy());
    U.on('upgrade', () => A.upgrade());
    U.on('para', () => A.para());
    U.on('perk', () => A.upgrade());
    U.on('altpapier', (r) => UI.toast({ icon: 'altpapier', kicker: 'Altpapier', title: r.n + ' Dubletten entsorgt', text: '+' + f(r.gain) + ' Akten', cls: 'blue' }));
    U.on('projDelay', (r) => { A.wrong(); UI.toast({ icon: 'flugzeug', kicker: 'Flughafen Schilda-Süd', title: 'Eröffnung verschoben!', text: 'Grund: ' + r.reason + '. Das Geld ist trotzdem weg.', cls: 'red', ms: 7000 }); });
    U.on('projStage', (r) => { A.upgrade(); UI.toast({ icon: r.id === 'portal' ? 'knopf' : 'flugzeug', kicker: D.PROJ[r.id].name, title: 'Abschnitt abgeschlossen', text: 'Weiter mit: ' + C.projStageName(r.id) }); });
    U.on('projDone', (r) => { if (r.id === 'flughafen') { A.fanfare(); UI.toast({ icon: 'flugzeug', kicker: 'Sensation', title: 'Der Flughafen ist eröffnet!', text: 'Produktion ×1,5 in diesem Durchgang.', cls: 'gold', ms: 8000 }); } });
    U.on('finale', () => setTimeout(() => UI.finale(), 400));
    U.on('saveError', () => UI.toast({ icon: 'widerspruch', kicker: 'Speichern fehlgeschlagen', title: 'Der Browser-Speicher ist voll oder gesperrt', text: 'Exportiere deinen Spielstand unter Optionen, damit nichts verloren geht.', cls: 'red', ms: 9000 }));
    U.on('chaos', (r) => UI.toast({ icon: 'stern', kicker: 'Schilda', title: 'Neue Lage: Produktion ' + U.mult(r.x), text: 'Die Schildbürger haben neu gewürfelt.' }));
    U.on('buff', (b) => { if (b.k === 'cost') lastSig.panel = ''; });
  }

  /* ---------- Bedienung ---------- */
  function onAction(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const act = el.dataset.action;
    const S = C.get();
    A.unlock();
    switch (act) {
      case 'tab': UI.setTab(el.dataset.tab); break;
      case 'nav': {
        const n = el.dataset.nav;
        if (n === 'desk') { document.body.dataset.view = 'desk'; lastSig.nav = ''; renderNav(); }
        else if (n === 'mehr') UI.setTab(['amt', 'urkunden', 'stats', 'optionen'].indexOf(tab) >= 0 ? tab : 'amt');
        else UI.setTab(n);
        break;
      }
      case 'amt': S.settings.buyAmt = String(el.dataset.amt); renderShop(true); break;
      case 'buyUp': if (C.buyUpgrade(el.dataset.id)) renderShop(true); break;
      case 'buyAllUps': C.buyAllUpgrades(); renderShop(true); break;
      case 'upMore': upOpen = !upOpen; renderShop(true); break;
      case 'buyGen': if (!e.target.closest('.gen-info')) C.buyGen(el.dataset.id, buyAmt()); break;
      case 'buyGrem': if (!e.target.closest('.gen-info')) C.buyGrem(el.dataset.id, buyAmt()); break;
      case 'info': e.stopPropagation(); openInfo[el.dataset.id] = !openInfo[el.dataset.id]; renderShop(true); break;
      case 'buyPara': C.buyPara(el.dataset.id); renderPanel(true); break;
      case 'buyNovelle': C.buyNovelle(); renderPanel(true); break;
      case 'fund': C.fundProject(el.dataset.id); renderPanel(true); break;
      case 'finaleAgain': UI.finale(true); break;
      case 'altpapier': C.altpapier(); renderPanel(true); break;
      case 'selLb': selLb = el.dataset.id; renderPanel(true); break;
      case 'reform': if (selLb && C.djGain() >= 1) reformConfirm(); break;
      case 'buyPerk': C.buyPerk(el.dataset.id); renderPanel(true); break;
      case 'buyStufe': C.buyStufe(); renderPanel(true); break;
      case 'toggle': {
        const k = el.dataset.key;
        S.settings[k] = !S.settings[k];
        UI.applySettings();
        renderPanel(true);
        break;
      }
      case 'ansage': if (!A.ansage()) UI.toast({ icon: 'telefon', title: 'Keine Sprachausgabe', text: 'Dieser Browser kann leider nicht sprechen. Bitte warten Sie trotzdem.' }); break;
      case 'saveNow': if (AS.Main.save()) UI.toast({ icon: 'haken', title: 'Gespeichert', cls: 'green', ms: 2000 }); break;
      case 'export': {
        const s = C.exportStr();
        const md = UI.modal('<h2>Spielstand exportieren</h2><p class="small">Kopiere diesen Text und bewahre ihn gut auf. Auf einem anderen Gerät kannst du ihn unter „Importieren“ einfügen.</p><textarea class="save-box" readonly>' + esc(s) + '</textarea><div class="modal-actions"><button class="btn" type="button" data-close>Schließen</button><button class="btn blue" type="button" data-copy autofocus>Kopieren</button></div>');
        const ta = md.el.querySelector('textarea');
        ta.addEventListener('focus', () => ta.select());
        md.el.querySelector('[data-copy]').addEventListener('click', () => {
          ta.select();
          const done = () => UI.toast({ icon: 'haken', title: 'Kopiert', cls: 'green', ms: 2000 });
          if (navigator.clipboard) navigator.clipboard.writeText(s).then(done, () => { document.execCommand('copy'); done(); });
          else { document.execCommand('copy'); done(); }
        });
        break;
      }
      case 'download': {
        const blob = new Blob([C.exportStr()], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'amtsschimmel-spielstand-' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        break;
      }
      case 'import': {
        const md = UI.modal('<h2>Spielstand importieren</h2><p class="small">Füge hier einen exportierten Spielstand ein (beginnt mit „AMT1:“). Der aktuelle Stand wird vorher gesichert.</p><textarea class="save-box" placeholder="AMT1:…" autofocus></textarea><p class="small" id="impErr" style="color:var(--red)"></p><div class="modal-actions"><button class="btn" type="button" data-close>Abbrechen</button><button class="btn blue" type="button" data-imp>Importieren</button></div>');
        md.el.querySelector('[data-imp]').addEventListener('click', () => {
          const r = C.importStr(md.el.querySelector('textarea').value);
          if (!r.ok) { md.el.querySelector('#impErr').textContent = r.error; return; }
          md.close();
          AS.Main.afterLoad();
          UI.toast({ icon: 'haken', title: 'Spielstand importiert', cls: 'green' });
        });
        break;
      }
      case 'restore': UI.confirm('Sicherungskopie wiederherstellen', '<p>Der aktuelle Spielstand wird durch die Sicherungskopie ersetzt.</p>', 'Wiederherstellen', () => { if (C.restoreBackup(el.dataset.key)) { AS.Main.afterLoad(); UI.toast({ icon: 'haken', title: 'Wiederhergestellt', cls: 'green' }); } }); break;
      case 'reset': {
        const md = UI.modal('<h2>Alles zurücksetzen?</h2><p>Der gesamte Fortschritt geht verloren – inklusive Dienstjahren, Laufbahn, Formularen und Urkunden. Tipp: Exportiere vorher deinen Spielstand.</p><p class="small">Zur Bestätigung bitte <b>LÖSCHEN</b> eintippen:</p><input class="save-box" style="min-height:0" id="resetIn" autocomplete="off" aria-label="Bestätigung"><div class="modal-actions"><button class="btn" type="button" data-close>Abbrechen</button><button class="btn primary" type="button" data-reset disabled>Endgültig zurücksetzen</button></div>');
        const inp = md.el.querySelector('#resetIn'), btn = md.el.querySelector('[data-reset]');
        inp.addEventListener('input', () => { btn.disabled = inp.value.trim().toUpperCase() !== 'LÖSCHEN'; });
        btn.addEventListener('click', () => { md.close(); C.hardReset(); AS.Main.afterLoad(); });
        setTimeout(() => inp.focus(), 30);
        break;
      }
      default: break;
    }
  }
  function onInput(e) {
    const el = e.target;
    const S = C.get();
    if (el.dataset.action === 'vol') { S.settings[el.dataset.key] = Number(el.value); UI.applySettings(); }
    if (el.dataset.action === 'fmt') { S.settings.numFmt = el.value; U.numFmt = el.value; UI.refresh(); }
    if (el.dataset.action === 'motion') { S.settings.motion = el.value; UI.applySettings(); }
  }
  UI.applySettings = function () {
    const st = C.get().settings;
    U.numFmt = st.numFmt;
    A.setEnabled(st.sound);
    A.setMusic(st.music);
    A.setVolumes(st.sfxVol, st.musicVol);
    document.body.classList.toggle('reduce-motion', st.motion === 'wenig');
    document.body.classList.toggle('allow-motion', st.motion === 'voll');
    document.body.classList.toggle('no-ticker', !st.ticker);
    updateSoundBtns();
  };

  /* ---------- Schleifen ---------- */
  UI.frame = function (dt) { updateTop(); updateTicker(dt); };
  UI.slow = function () {
    document.title = f(C.get().akten) + ' Akten · Amtsschimmel';
    renderTabs();
    renderNav();
    if (wide() || tab === 'shop') renderShop();
    renderPanel();
  };
  UI.init = function () {
    document.querySelectorAll('[data-icon]').forEach((el) => { if (!el.innerHTML) el.innerHTML = AS.ICON(el.dataset.icon); });
    $('btnOptions').innerHTML = AS.ICON('optionen');
    document.addEventListener('click', onAction);
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.gen-row[data-action]')) { e.preventDefault(); onAction(e); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const backs = document.querySelectorAll('.modal-back');
      const top = backs[backs.length - 1];
      if (top && top.querySelector('.close')) { e.preventDefault(); top.querySelector('.close').click(); }
    });
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    $('btnSound').addEventListener('click', () => { const st = C.get().settings; st.sound = !st.sound; UI.applySettings(); if (st.sound) A.unlock(); });
    $('btnMusic').addEventListener('click', () => { const st = C.get().settings; st.music = !st.music; if (st.music) st.sound = true; UI.applySettings(); A.unlock(); });
    // Nach Mausklick den Fokus von Knöpfen nehmen, damit die Leertaste nicht versehentlich erneut kauft
    document.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') { const b = e.target.closest('button, [role="button"]'); if (b && !b.classList.contains('doc')) setTimeout(() => b.blur(), 0); } });
    window.addEventListener('resize', () => { placeShop(); lastSig = {}; shopSig = ''; });
    hookEvents();
    document.body.dataset.era = C.get().era;
    A.setEra(C.get().era);
    UI.applySettings();
    UI.setTab('amt');
    if (compact()) document.body.dataset.view = 'desk';
    UI.refresh();
  };
})(window);

'use strict';
/* Amtsschimmel – Schreibtisch: Akte, Stempel, Arbeitsfluss, Buffs, Bürgeranliegen, Amtsschimmel, Maskottchen. */
(function (root) {
  const AS = root.AS;
  const U = AS.U, D = AS.D, C = AS.Core, A = AS.Audio;
  const Desk = (AS.Desk = {});
  const $ = (id) => document.getElementById(id);
  const ic = (n) => '<span data-icon="' + n + '">' + AS.ICON(n) + '</span>';

  const AMT = ['Tempelverwaltung zu Ur', 'Tabularium Romanum', 'Kanzlei zu Siegelsheim', 'Königlich Preußische Regierung', 'Kaiserliches Bezirksamt',
    'Bezirksamt Amtshausen', 'Landesrechenzentrum', 'Digitales Bürgeramt', 'KI-Verwaltungszentrum', 'Weltamt · Abteilung Erde'];
  const KIND = ['Tontafel', 'Tabula', 'Urkunde', 'Acta', 'Antrag', 'Antrag (Durchschlag)', 'Ausdruck', 'Onlineantrag', 'Vorgang', 'Interplanetarer Vorgang'];
  const BUFF_ICON = { prod: 'kaffee', click: 'stempel', stamp: 'stempel', cost: 'r_fin', gen: 'laufbahn' };

  let docEl = null, curNo = -1, lastRessortSig = '', lastFlowShown = -1, tipShownAt = 0, bubbleTimer = 0, anlTimer = null, schEl = null;
  let pointerPos = null;

  /* ---------- Akte ---------- */
  function docHTML(d) {
    const S = C.get();
    const era = S.era;
    const r = d.r >= 0 ? D.RESSORTS[d.r] : null;
    let band = '';
    if (d.type === 'eilt') band = '<div class="doc-band eilt"><span>Eilt!</span><div class="doc-timer"><i></i></div></div>';
    else if (d.type === 'wider') band = '<div class="doc-band wider"><span>Widerspruch</span><span>doppelte Prüfung</span></div>';
    else if (d.type === 'gross') band = '<div class="doc-band gross"><span>Mitzeichnung</span><span>3 Ressorts</span></div>';
    const seq = d.seq ? '<div class="doc-seq">' + d.seq.map((ri, i) => '<span data-i="' + i + '" style="background:' + D.RESSORTS[ri].color + '">' + AS.ICON('r_' + D.RESSORTS[ri].id) + '</span>' + (i < 2 ? '<em>→</em>' : '')).join('') + '</div>' : '';
    const sticker = r ? '<div class="doc-sticker" style="background:' + r.color + '">' + AS.ICON('r_' + r.id) + '<b>' + U.esc(r.name) + '</b></div>' : '';
    const pipsN = Math.round(d.need * 5);
    let pips = '';
    for (let i = 0; i < pipsN; i++) pips += '<i></i>';
    const who = d.who + (d.place ? ', ' + d.place : '');
    return band +
      '<div class="doc-head"><div><div class="doc-amt">' + U.esc(AMT[era]) + '</div><div>' + U.esc(D.ERAS[era].date) + '</div></div><div class="doc-az">Az. ' + U.esc(d.az || '') + '</div></div>' +
      '<div class="doc-kind">' + U.esc(KIND[era]) + ' Nr. ' + d.no + '</div>' +
      '<div class="doc-title">' + U.esc(d.title) + '</div>' +
      '<div class="doc-who">' + (era < 4 ? 'Von: ' : 'Antragsteller/in: ') + U.esc(who) + '</div>' +
      seq +
      '<div class="doc-lines"><i></i><i></i><i></i><i></i><i style="width:60%"></i></div>' +
      '<div class="doc-foot"><div class="doc-pips">' + pips + '</div><span class="doc-foot-hint"></span></div>' +
      sticker;
  }
  function mountDoc(d, enter) {
    const slot = $('docSlot');
    const el = document.createElement('div');
    el.className = 'doc e' + C.get().era + (d.r >= 0 ? ' has-sticker' : '') + (enter ? ' enter' : '');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Akte: ' + d.title + (d.r >= 0 ? ', Ressort ' + D.RESSORTS[d.r].name : '') + '. Klicken für den Eingangsstempel.');
    el.innerHTML = docHTML(d);
    el.dataset.no = d.no;
    slot.appendChild(el);
    if (enter) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('enter')));
    docEl = el; curNo = d.no;
    updateDocState();
    return el;
  }
  function retire(el, cls) {
    if (!el) return;
    el.classList.add(cls);
    el.removeAttribute('tabindex');
    setTimeout(() => el.remove(), 420);
  }
  function updateDocState() {
    const S = C.get();
    const d = S.korb.doc;
    if (!d || !docEl) return;
    const pips = docEl.querySelectorAll('.doc-pips i');
    const on = Math.round(d.prog * 5 + 1e-6);
    pips.forEach((p, i) => p.classList.toggle('on', i < on));
    if (d.seq) {
      const step = Math.floor(d.prog + 1e-9);
      docEl.querySelectorAll('.doc-seq span').forEach((s, i) => { s.classList.toggle('now', i === step); s.classList.toggle('done', i < step); });
      const st = docEl.querySelector('.doc-sticker');
      const r = D.RESSORTS[d.r];
      if (st && r) { st.style.background = r.color; st.innerHTML = AS.ICON('r_' + r.id) + '<b>' + U.esc(r.name) + '</b>'; }
    }
    const hint = docEl.querySelector('.doc-foot-hint');
    if (hint) hint.textContent = d.r < 0 ? 'Eingangsstempel × ' + Math.max(0, Math.ceil((d.need - d.prog) * 5 - 1e-6)) : (d.type === 'wider' ? 'noch ' + (d.need - Math.floor(d.prog)) + '× ' + D.RESSORTS[d.r].short : 'zuständig: ' + D.RESSORTS[d.r].short);
  }
  function imprint(text, opts) {
    if (!docEl) return;
    opts = opts || {};
    const el = document.createElement('div');
    el.className = 'imprint ' + (opts.cls || '');
    const rect = docEl.getBoundingClientRect();
    let x, y;
    if (opts.at && rect.width) { x = opts.at.x - rect.left; y = opts.at.y - rect.top; }
    else { x = rect.width * U.range(0.3, 0.7); y = rect.height * U.range(0.42, 0.75); }
    x = U.clamp(x, 40, Math.max(41, rect.width - 40)); y = U.clamp(y, 30, Math.max(31, rect.height - 24));
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.setProperty('--rot', 'translate(-50%,-50%) rotate(' + U.range(-14, 10).toFixed(1) + 'deg)');
    if (opts.color) el.style.color = opts.color;
    el.innerHTML = text;
    docEl.appendChild(el);
    const all = docEl.querySelectorAll('.imprint');
    if (all.length > 14) all[0].remove();
  }
  function stampGhost(x, y) {
    if (document.body.classList.contains('reduce-motion')) return;
    const g = document.createElement('div');
    g.className = 'stamp-ghost';
    g.innerHTML = AS.ICON('stempel');
    g.style.left = x + 'px'; g.style.top = y + 'px';
    document.body.appendChild(g);
    setTimeout(() => g.remove(), 260);
  }
  function docCenter() {
    if (!docEl) return { x: innerWidth / 2, y: innerHeight / 2 };
    const r = docEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.55 };
  }
  Desk.floater = function (text, x, y, cls) {
    const f = document.createElement('div');
    f.className = 'floater ' + (cls || '');
    f.textContent = text;
    f.style.left = x + 'px'; f.style.top = y + 'px';
    $('floaters').appendChild(f);
    setTimeout(() => f.remove(), 1000);
  };

  /* ---------- Stempelleiste ---------- */
  function renderStamps() {
    const rs = C.activeRessorts();
    const sig = rs.join(',') + '|' + C.get().era;
    if (sig === lastRessortSig) return;
    lastRessortSig = sig;
    const bar = $('stampbar');
    if (!rs.length) {
      bar.innerHTML = '<button class="stamp-btn" type="button" data-stamp="eingang" style="--rc:#7a5b3f" aria-label="Eingangsstempel (Leertaste)"><span class="stamp-face">' + ic('eingang') + '<span>Eingang</span></span><span class="stamp-key">␣</span></button>';
    } else {
      bar.innerHTML = rs.map((i) => {
        const r = D.RESSORTS[i];
        return '<button class="stamp-btn" type="button" data-stamp="' + i + '" style="--rc:' + r.color + '" aria-label="Ressortstempel ' + U.esc(r.name) + ' (Taste ' + r.key + ')"><span class="stamp-face">' + ic('r_' + r.id) + '<span>' + U.esc(r.short) + '</span></span><span class="stamp-key">' + r.key + '</span></button>';
      }).join('');
    }
    $('flowBox').hidden = !rs.length;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    $('deskHint').innerHTML = rs.length
      ? (touch ? 'Tippe den <b>zuständigen Ressortstempel</b>. Tippen auf die Akte = Eingangsstempel.' : 'Drück den <b>zuständigen Ressortstempel</b> (Tasten <kbd>1</kbd>–<kbd>' + rs.length + '</kbd>). Klick auf die Akte = Eingangsstempel.')
      : (touch ? 'Tippe auf die Akte, um sie abzustempeln.' : 'Klicke auf die Akte oder drücke die <kbd>Leertaste</kbd>, um sie abzustempeln.');
  }
  function flashStamp(i, ok) {
    const b = $('stampbar').querySelector('[data-stamp="' + i + '"]');
    if (!b) return;
    b.classList.remove('flash-ok', 'flash-bad', 'pressed');
    void b.offsetWidth;
    b.classList.add(ok ? 'flash-ok' : 'flash-bad', 'pressed');
    setTimeout(() => b.classList.remove('pressed'), 90);
  }

  /* ---------- Aktionen ---------- */
  Desk.eingang = function (at) {
    A.unlock();
    const pos = at || docCenter();
    stampGhost(pos.x, pos.y);
    pointerPos = pos;
    C.eingang();
    pointerPos = null;
  };
  Desk.ressort = function (i) {
    A.unlock();
    const S = C.get();
    const d = S.korb.doc;
    if (!d) return;
    if (d.r < 0) { Desk.eingang(); flashStamp('eingang', true); return; }
    if (C.activeRessorts().indexOf(i) < 0) return;
    const pos = docCenter();
    stampGhost(pos.x + U.range(-40, 40), pos.y);
    flashStamp(i, i === d.r);
    C.ressort(i);
  };

  /* ---------- Ereignisse aus der Logik ---------- */
  function onStamp(e) {
    const S = C.get();
    const kind = e.kind;
    const pos = pointerPos || docCenter();
    if (kind === 'eingang') {
      imprint(D.STAMPS.eingang + '<small>' + U.esc(D.ERAS[S.era].date) + '</small>', { cls: 'small', at: pointerPos, color: 'var(--blue-ink)' });
      A.stamp('eingang');
      Desk.floater('+' + U.fmt(e.gain, { dec: 1 }), pos.x + U.range(-30, 30), pos.y - 20);
      if (docEl) { docEl.classList.remove('thump'); void docEl.offsetWidth; docEl.classList.add('thump'); }
    } else if (kind === 'correct') {
      const t = U.pick(D.STAMPS.correct);
      imprint(t, { cls: 'big', color: 'var(--red-ink)' });
      A.stamp('correct', e.flow);
      Desk.floater('+' + U.fmt(e.gain, { dec: 1 }), pos.x + U.range(-40, 40), pos.y - 40, 'big');
      if (e.flow > 0 && e.flow % 10 === 0 && e.flow !== lastFlowShown) { A.bell(); lastFlowShown = e.flow; }
    } else if (kind === 'auto') {
      imprint(D.STAMPS.auto, { cls: 'small round', color: 'var(--blue-ink)' });
      A.stamp('auto');
      if (Math.random() < 0.5) Desk.floater('+' + U.fmt(e.gain, { dec: 1 }), pos.x + U.range(-40, 40), pos.y - 10);
    } else if (kind === 'wrong') {
      imprint(D.STAMPS.wrong, { cls: 'big', color: 'rgba(60,60,70,.85)' });
      A.wrong();
      Desk.floater(e.kept ? 'Unzuständig – Eingang voll!' : 'Widerspruch!', pos.x, pos.y - 30, 'bad');
      if (e.kept && docEl) { docEl.classList.remove('shake'); void docEl.offsetWidth; docEl.classList.add('shake'); }
      lastFlowShown = -1;
    }
    updateDocState();
  }
  function onDocDone(e) {
    const special = e.d.type !== 'normal';
    if (special) {
      const label = e.d.type === 'eilt' ? 'Fristgerecht!' : e.d.type === 'wider' ? 'Widerspruch erledigt!' : 'Mitgezeichnet!';
      const p = docCenter();
      Desk.floater(label + ' +' + U.fmt(e.bonus), p.x, p.y - 70, 'big');
    }
    A.docDone(special);
    retire(docEl, 'leave');
    docEl = null;
    bumpTray('out');
  }
  function onDocNew(d) {
    if (docEl && Number(docEl.dataset.no) !== d.no) {
      // falscher Stempel: Akte geht zurück in den Eingang
      if (!docEl.classList.contains('leave')) retire(docEl, C.get().korb.pending.length ? 'leave-back' : 'leave-miss');
      docEl = null;
    }
    mountDoc(d, true);
    if (d.type === 'eilt') A.eilt();
    if (C.get().era === 5 && Math.random() < 0.08) A.fax();
    bumpTray('in');
  }
  function onEiltMissed() {
    const p = docCenter();
    Desk.floater('Frist versäumt', p.x, p.y - 30, 'bad');
    if (docEl) { retire(docEl, 'leave-miss'); docEl = null; }
  }
  function bumpTray(which) {
    const S = C.get();
    if (which === 'in') {
      const n = S.korb.pending.length;
      $('trayInCount').textContent = n ? n : '';
      $('trayIn').title = n ? n + ' Widersprüche warten im Eingang' : 'Eingang';
    } else {
      const n = S.run.docs;
      $('trayOutCount').textContent = n ? U.fmt(n) : '';
      const papers = Math.min(7, Math.floor(Math.log10(1 + n) * 2));
      const host = $('trayOut').querySelector('.tray-papers');
      if (host.childElementCount !== papers) host.innerHTML = Array.from({ length: papers }, (_, i) => '<i style="bottom:' + (i * 3) + 'px;transform:rotate(' + ((i * 37) % 9 - 4) + 'deg)"></i>').join('');
    }
  }

  /* ---------- Bürgeranliegen ---------- */
  function showAnliegen(a, silent) {
    const slot = $('anliegenSlot');
    const S = C.get();
    slot.innerHTML = '<div class="anliegen" role="dialog" aria-label="Bürgeranliegen">' +
      '<div class="anliegen-head">' + ic('telefon') + '<span>Am Schalter</span><span class="anl-timer"><i id="anlTimer"></i></span></div>' +
      '<div class="anliegen-text"><b>' + U.esc(a.who) + '</b> ' + U.esc(a.text) + '</div>' +
      '<div class="anliegen-opts">' + a.opts.map((o, i) => '<button class="btn opt" type="button" data-anl="' + i + '">' + U.esc(o.label) + '</button>').join('') + '</div></div>';
    if (!silent) {
      A.anliegen();
      AS.UI.announce('Bürgeranliegen am Schalter: ' + a.who + ' ' + a.text);
      if (document.body.dataset.view !== 'desk' && window.matchMedia('(max-width: 759px)').matches) {
        AS.UI.toast({ icon: 'telefon', kicker: 'Am Schalter', title: 'Kundschaft wartet', text: 'Tippe auf „Schreibtisch“, um das Anliegen zu bearbeiten.', ms: 6000 });
      }
    }
    const until = S.anliegen.until;
    clearInterval(anlTimer);
    anlTimer = setInterval(() => {
      const t = $('anlTimer');
      if (!t) { clearInterval(anlTimer); return; }
      t.style.width = U.clamp((until - C.get().gt) / 90 * 100, 0, 100) + '%';
    }, 250);
  }
  function answered(r) {
    clearInterval(anlTimer);
    const slot = $('anliegenSlot');
    slot.innerHTML = '<div class="anliegen"><div class="anliegen-head">' + ic('telefon') + '<span>Erledigt</span></div>' +
      '<div class="anliegen-res">' + U.esc(r.res) + (r.gains.length ? '<div class="gains">' + r.gains.map(U.esc).join(' · ') + '</div>' : '') + '</div>' +
      '<div class="anliegen-opts"><button class="btn small" type="button" data-anl="close">Weiter</button></div></div>';
    clearTimeout(answered.t);
    answered.t = setTimeout(() => { slot.innerHTML = ''; }, 6000);
  }
  function anliegenGone() {
    clearInterval(anlTimer);
    $('anliegenSlot').innerHTML = '';
    AS.UI.toast({ icon: 'telefon', kicker: 'Schalter', title: 'Niemand mehr da', text: 'Die Kundschaft ist wieder gegangen. Vielleicht beim nächsten Mal.' });
  }

  /* ---------- Amtsschimmel ---------- */
  function spawnSchimmel(e, silent) {
    removeSchimmel();
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'schimmel' + (Math.random() < 0.5 ? ' rtl' : '');
    el.setAttribute('aria-label', 'Den Amtsschimmel fangen');
    el.innerHTML = AS.ICONS.schimmel;
    el.style.top = U.range(14, 64) + '%';
    el.style.setProperty('--dur', Math.max(4, e.life) + 's');
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const r = C.catchSchimmel();
      if (!r) return;
      el.classList.add('caught');
      setTimeout(() => el.remove(), 500);
      schEl = null;
      A.catchSchimmel();
      Desk.floater(r.name, ev.clientX, ev.clientY - 20, 'big');
      AS.UI.toast({ icon: 'stern', kicker: 'Amtsschimmel gefangen', title: r.name, text: r.text, cls: 'gold' });
    });
    $('schimmelLayer').appendChild(el);
    schEl = el;
    if (silent) return;
    A.schimmel();
    AS.UI.announce('Der Amtsschimmel galoppiert vorbei! Schnell anklicken.');
  }
  function removeSchimmel() { if (schEl) { schEl.remove(); schEl = null; } }

  /* ---------- Maskottchen & Tipps ---------- */
  Desk.say = function (text, opts) {
    opts = opts || {};
    const b = $('mascotBubble');
    b.innerHTML = U.esc(text) + (opts.ok ? '<div><button class="btn small" type="button" data-tipok="1">Verstanden</button></div>' : '');
    b.hidden = false;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { b.hidden = true; }, opts.ms || (opts.ok ? 30000 : 6000));
  };
  let curTip = null;
  function checkTips() {
    const S = C.get();
    if (curTip && curTip.done && !$('mascotBubble').hidden) { try { if (curTip.done(S)) { $('mascotBubble').hidden = true; curTip = null; } } catch (e) { curTip = null; } }
    if (!S.settings.tips) return;
    if (performance.now() - tipShownAt < 9000) return;
    if (!$('mascotBubble').hidden) return;
    for (const t of D.TIPS) {
      if (S.tips[t.id]) continue;
      let ok = false;
      try { ok = t.when(S, C); } catch (e) { ok = false; }
      if (ok) {
        S.tips[t.id] = 1;
        if (t.id === 'flughafen') S.flags.tipFlug = true;
        tipShownAt = performance.now();
        curTip = t;
        Desk.say(t.text, { ok: true });
        return;
      }
    }
  }

  /* ---------- Buffs ---------- */
  let buffSig = '';
  function renderBuffs() {
    const S = C.get();
    const host = $('buffs');
    const sig = S.buffs.map((b) => b.id).join('|');
    if (sig !== buffSig) {
      buffSig = sig;
      host.innerHTML = S.buffs.map((b) => '<span class="buff' + (b.x < 1 ? ' bad' : '') + '" data-bid="' + U.esc(b.id) + '">' + ic(BUFF_ICON[b.k] || 'stern') +
        '<span>' + U.esc(b.name || '') + ' ' + U.mult(b.x) + '</span> <small class="bt"></small><i></i></span>').join('');
    }
    for (const b of S.buffs) {
      const el = host.querySelector('[data-bid="' + CSS.escape(b.id) + '"]');
      if (!el) continue;
      const left = Math.max(0, b.end - S.gt);
      el.querySelector('.bt').textContent = U.clock(left);
      el.querySelector('i').style.width = (left / b.dur * 100) + '%';
    }
  }

  /* ---------- Laufende Aktualisierung ---------- */
  Desk.update = function () {
    const S = C.get();
    const M = C.M;
    renderStamps();
    const d = S.korb.doc;
    if (d && curNo !== d.no) { if (docEl) retire(docEl, 'leave'); mountDoc(d, true); }
    // EILT-Timer
    if (d && d.type === 'eilt' && docEl) {
      const t = docEl.querySelector('.doc-timer i');
      if (t) t.style.transform = 'scaleX(' + U.clamp((d.deadline - S.gt) / d.dur, 0, 1) + ')';
    }
    // Hilfe: zuständigen Stempel hervorheben
    const assist = M.F.assist && d && d.r >= 0;
    $('stampbar').querySelectorAll('.stamp-btn').forEach((b) => b.classList.toggle('hint', !!assist && b.dataset.stamp === String(d.r)));
    // Arbeitsfluss
    const fl = Math.floor(S.korb.flow);
    $('flowFill').style.width = (S.korb.flow / M.F.flowMax * 100) + '%';
    U.setT($('flowText'), fl + ' · ' + U.mult(M.flowMult));
    renderBuffs();
  };
  Desk.slow = function () { checkTips(); bumpTray('in'); bumpTray('out'); };

  Desk.reset = function () {
    $('docSlot').innerHTML = '';
    docEl = null; curNo = -1; lastRessortSig = ''; buffSig = '';
    $('anliegenSlot').innerHTML = '';
    removeSchimmel();
    const S = C.get();
    if (S.korb.doc) mountDoc(S.korb.doc, false);
    if (S.anliegen.cur) showAnliegen(D.ANL[S.anliegen.cur], true);
    // Ein laufender Amtsschimmel bleibt fangbar (z. B. nach einem Epochenwechsel)
    if (S.schimmel.active && S.schimmel.until > S.gt) spawnSchimmel({ life: S.schimmel.until - S.gt }, true);
    renderStamps();
    bumpTray('in'); bumpTray('out');
  };

  Desk.init = function () {
    U.setT = (el, txt) => { if (el && el._t !== txt) { el._t = txt; el.textContent = txt; } };
    $('mascotHead').innerHTML = AS.ICONS.schimmelKopf;
    $('docSlot').addEventListener('click', (e) => {
      const el = e.target.closest('.doc');
      if (!el || el.classList.contains('leave') || el.classList.contains('leave-back')) return;
      Desk.eingang({ x: e.clientX, y: e.clientY });
    });
    $('docSlot').addEventListener('keydown', (e) => {
      if ((e.key === 'Enter') && e.target.classList.contains('doc')) { e.preventDefault(); Desk.eingang(); }
    });
    $('stampbar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-stamp]');
      if (!b) return;
      if (b.dataset.stamp === 'eingang') { Desk.eingang(); flashStamp('eingang', true); } else Desk.ressort(Number(b.dataset.stamp));
    });
    $('anliegenSlot').addEventListener('click', (e) => {
      const b = e.target.closest('[data-anl]');
      if (!b) return;
      A.unlock();
      if (b.dataset.anl === 'close') { $('anliegenSlot').innerHTML = ''; return; }
      const r = C.answerAnliegen(Number(b.dataset.anl));
      if (r) answered(r);
    });
    $('mascotHead').addEventListener('click', () => {
      A.unlock(); A.neigh();
      Desk.say(C.mascotClick());
    });
    $('mascotBubble').addEventListener('click', (e) => { if (e.target.closest('[data-tipok]')) $('mascotBubble').hidden = true; });

    U.on('stamp', onStamp);
    U.on('docDone', onDocDone);
    U.on('docNew', onDocNew);
    U.on('docStep', updateDocState);
    U.on('eiltMissed', onEiltMissed);
    U.on('anliegen', showAnliegen);
    U.on('anliegenGone', anliegenGone);
    U.on('schimmelSpawn', spawnSchimmel);
    U.on('schimmelGone', removeSchimmel);
    U.on('era', () => { lastRessortSig = ''; });
    Desk.reset();
  };
})(window);

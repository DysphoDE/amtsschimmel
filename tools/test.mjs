// Tests für Spiellogik, Daten und Spielstand. Aufruf: node tools/test.mjs
import { createRequire } from 'module';
import assert from 'assert/strict';
const require = createRequire(import.meta.url);
const AS = require('./load.cjs')();
const { U, D, Core: C } = AS;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.log('✗ ' + name + '\n   ' + (e && e.message)); }
}
let now = Date.UTC(2026, 9, 5, 9, 0, 0);
C.now = () => now;
U.setRandom(U.mulberry32(7));
const mem = {};
C.storage = { get: (k) => (k in mem ? mem[k] : null), set: (k, v) => { mem[k] = String(v); }, remove: (k) => { delete mem[k]; } };

/* ---------- Zahlenformat ---------- */
test('Zahlenformat: nie drei Nachkommastellen', () => {
  U.numFmt = 'kurz';
  assert.equal(U.fmt(5), '5');
  assert.equal(U.fmt(1234), '1.234');
  assert.equal(U.fmt(414765), '414.765');
  assert.equal(U.fmt(1e6), '1 Mio.');
  assert.equal(U.fmt(1.2e6), '1,2 Mio.');
  assert.equal(U.fmt(9.6e6), '9,6 Mio.');
  assert.equal(U.fmt(12.63e6), '12,6 Mio.');
  assert.equal(U.fmt(123.456e6), '123 Mio.');
  assert.equal(U.fmt(4.003e9), '4 Mrd.');
  assert.equal(U.fmt(999.9999e6), '999 Mio.');
  for (let e = 6; e < 66; e += 0.37) {
    const s = U.fmt(Math.pow(10, e));
    assert.ok(!/\d,\d{3}/.test(s), 'drei Nachkommastellen: ' + s);
  }
  assert.deepEqual(U.fmtParts(12.6301e6), { num: '12,63', word: 'Millionen' });
  assert.deepEqual(U.fmtParts(1e6), { num: '1,00', word: 'Million' });
  assert.equal(U.fmt(1.5e6, { words: true }), '1,5 Millionen');
  assert.equal(U.fmt(2e9, { words: true }), '2 Milliarden');
  U.numFmt = 'wiss';
  assert.equal(U.fmt(1.2345e15), '1,23e15');
  U.numFmt = 'kurz';
  assert.equal(U.fmt(0.55, { dec: 1 }), '0,5');
  assert.equal(U.fmt(NaN), '0');
  assert.equal(U.fmt(-1500), '−1.500');
});

/* ---------- Datenintegrität ---------- */
const KNOWN_FX = ['gen', 'cat', 'prod', 'prodAdd', 'perGrem', 'click', 'clickPct', 'stamp', 'flowMax', 'flowDecay', 'eilt', 'eiltFreq', 'eiltTime',
  'wider', 'formRate', 'schimFreq', 'schimDur', 'schimLife', 'anlFreq', 'anlRew', 'lucky', 'v', 'parkinson', 'noParkinson', 'rechts', 'cost',
  'upCost', 'paraCost', 'projCost', 'offEff', 'offCap', 'auto', 'dj', 'djGain', 'syn', 'flatPer', 'assist', 'ressortMax', 'divers', 'chaos', 'flag'];
test('Daten: Effekte, IDs und Verweise sind gültig', () => {
  const all = [...D.UPGRADES, ...D.PARAS, ...D.PERKS, ...D.LEITBILDER, ...D.ORDNER, ...D.PROJECTS];
  for (const x of all) for (const e of x.fx || []) {
    assert.ok(KNOWN_FX.includes(e.t), 'unbekannter Effekt ' + e.t + ' in ' + x.id);
    if (e.t === 'gen' || e.t === 'syn' || e.t === 'flatPer') assert.ok(D.GEN[e.id], 'Generator fehlt: ' + e.id);
    if (e.t === 'syn') assert.ok(D.GEN[e.src], 'Quelle fehlt: ' + e.src);
    if (e.t === 'cat') assert.ok(['person', 'sache', 'technik', 'all'].includes(e.cat));
  }
  for (const list of [D.UPGRADES, D.PARAS, D.PERKS, D.FORMS, D.ACH, D.ANLIEGEN]) {
    const ids = new Set();
    for (const x of list) { assert.ok(!ids.has(x.id), 'doppelte ID ' + x.id); ids.add(x.id); }
  }
  for (const u of D.UPGRADES) if (u.req && u.req.gen) assert.ok(D.GEN[u.req.gen]);
  for (const p of D.PERKS) if (p.req) assert.ok(D.PERK[p.req], 'Perk-Voraussetzung fehlt: ' + p.req);
  for (const p of D.PARAS) if (p.req) assert.equal(D.PARA[p.req].teil, p.teil);
  for (const f of D.FORMS) { assert.ok(D.ORDNER.find((o) => o.id === f.ordner)); assert.ok(D.RARITY[f.r]); }
  for (const a of D.ANLIEGEN) { assert.ok(a.opts.length >= 2); for (const o of a.opts) assert.ok(o.fx && (o.res || o.fx.chance)); }
  for (const g of D.GENS) assert.equal(D.TIERS.length, D.UPGRADES.filter((u) => u.gen === g.id).length);
  for (let i = 1; i < D.ERAS.length; i++) assert.ok(D.ERAS[i].at > D.ERAS[i - 1].at);
  for (let i = 1; i < D.GENS.length; i++) assert.ok(D.GENS[i].cost > D.GENS[i - 1].cost && D.GENS[i].prod > D.GENS[i - 1].prod);
  for (const k in D.TITLES) assert.ok(D.TITLES[k].length >= 10);
});

/* ---------- Grundmechanik ---------- */
test('Stempeln, Kaufen, Epochenwechsel', () => {
  C.init();
  const S = C.get();
  for (let i = 0; i < 20; i++) C.eingang();
  assert.equal(S.stats.clicks, 20);
  assert.ok(S.akten >= 20);
  assert.ok(S.stats.docs >= 3, 'fünf Eingangsstempel schließen einen Vorgang');
  assert.equal(C.buyGen('schreiber', 1), 1);
  assert.equal(S.gens.schreiber, 1);
  assert.equal(C.buyGen('tabularium', 1), 0, 'Tabularium erst in Rom');
  S.akten = 1e5;
  C.tick(1);
  C.earn(1000);
  C.tick(1);
  assert.ok(S.era >= 1, 'Epoche Rom ab 500 Akten');
  assert.ok(C.activeRessorts().length === 2);
});

test('Ressortstempel: richtig baut Fluss auf, falsch erzeugt Widerspruch', () => {
  C.init();
  const S = C.get();
  C.earn(1e3); C.tick(1);
  while (C.doc().r < 0) C.eingang();
  let d = C.doc();
  assert.ok(d.r >= 0);
  const g = C.ressort(d.r);
  assert.ok(g > 0 && S.korb.flow === 1);
  d = C.doc();
  const wrong = (d.r + 1) % C.activeRessorts().length;
  C.ressort(wrong);
  assert.equal(S.korb.flow, 0);
  assert.equal(S.korb.pending.length, 1);
  assert.equal(S.korb.pending[0].type, 'wider');
  // Widerspruch kommt nach drei Vorgängen zurück
  for (let i = 0; i < 4; i++) { const x = C.doc(); if (x.type === 'wider') break; C.ressort(x.r); }
  assert.equal(C.doc().type, 'wider');
  const before = S.stats.wider;
  C.ressort(C.doc().r); C.ressort(C.doc().r);
  assert.equal(S.stats.wider, before + 1);
});

test('Vertretung stempelt nur, wenn man selbst pausiert', () => {
  C.init();
  const S = C.get();
  S.perks.vertretungsplan = true;
  C.earn(1e3); C.recalc(); C.tick(1);
  C.ressort(C.doc().r);
  const a0 = S.stats.auto;
  C.tick(1); C.tick(1);
  assert.equal(S.stats.auto, a0, 'während aktiver Arbeit keine Vertretung');
  for (let i = 0; i < 10; i++) C.tick(1);
  assert.ok(S.stats.auto > a0);
});

test('Amtsschimmel erscheint nur bei Sichtbarkeit und lässt sich fangen', () => {
  C.init();
  const S = C.get();
  C.visible = false;
  for (let i = 0; i < 400; i++) C.tick(1);
  assert.equal(S.schimmel.active, false);
  C.visible = true;
  for (let i = 0; i < 400 && !S.schimmel.active; i++) C.tick(1);
  assert.equal(S.schimmel.active, true);
  const r = C.catchSchimmel();
  assert.ok(r && r.name);
  assert.equal(S.stats.schimmel, 1);
  assert.equal(C.catchSchimmel(), null);
});

test('Bürgeranliegen: Antwort wirkt und plant das nächste', () => {
  C.init();
  const S = C.get();
  C.visible = true;
  for (let i = 0; i < 1200 && !S.anliegen.cur; i++) C.tick(1);
  assert.ok(S.anliegen.cur, 'Anliegen erscheint');
  const r = C.answerAnliegen(0);
  assert.ok(r && typeof r.res === 'string');
  assert.equal(S.anliegen.cur, null);
  assert.equal(S.stats.anliegen, 1);
});

/* ---------- Reform ---------- */
test('Reform: setzt Durchgang zurück, behält Dauerhaftes, Reformmüdigkeit', () => {
  C.init();
  const S = C.get();
  S.totalAkten = 1e14; S.runAkten = 1e14; S.akten = 5e13; S.gens.schreiber = 50; S.forms.f0 = 1; S.paras.p1 = true;
  C.recalc();
  const gain = C.djGain();
  assert.ok(gain >= 10);
  assert.equal(C.reform('kameral').gain, gain);
  assert.equal(S.dj, gain);
  assert.equal(S.pp, gain);
  assert.equal(S.akten, 0);
  assert.equal(S.gens.schreiber, undefined);
  assert.equal(S.forms.f0, 1);
  assert.equal(S.paras.p1, undefined, 'ohne Bestandsschutz gehen Paragrafen verloren');
  assert.equal(S.streak, 1, 'zweimal Kameralistik');
  assert.equal(C.M.muede, 1, 'Kameralistik ist immun');
  assert.equal(C.reform('zentral'), null, 'ohne neue Dienstjahre keine Reform');
  S.totalAkten = 1e17; C.recalc();
  C.reform('zentral'); assert.equal(S.streak, 0);
  S.totalAkten = 1e19; C.recalc();
  C.reform('zentral'); assert.equal(S.streak, 1);
  assert.ok(Math.abs(C.M.muede - 0.85) < 1e-9);
  assert.equal(C.reform('digital'), null, 'Digitalisierung noch nicht freigeschaltet');
});

test('Laufbahn: Voraussetzungen und Stufen', () => {
  C.init();
  const S = C.get();
  S.pp = 1e6;
  assert.equal(C.buyPerk('haushaltsautomatik'), false, 'erst Übergangsgeld');
  assert.ok(C.buyPerk('uebergangsgeld'));
  assert.equal(C.buyPerk('haushaltsautomatik'), false, 'Mittlerer Dienst braucht 3 Stufen im Einfachen');
  assert.ok(C.buyPerk('stempelfest') && C.buyPerk('fristgerecht'));
  assert.equal(C.buyPerk('personalautomatik'), false, 'Gehobener Dienst braucht 3 Stufen im Mittleren');
  assert.ok(C.buyPerk('haushaltsautomatik') && C.buyPerk('bestandsschutz1') && C.buyPerk('formularkunde'));
  assert.ok(C.buyPerk('personalautomatik'));
  const c = C.stufeCost();
  assert.ok(C.buyStufe());
  assert.equal(C.stufeCost(), c * 2);
});

test('Finale nur einmal, Flughafen mit Verschiebungen', () => {
  C.init();
  const S = C.get();
  S.era = 9; S.maxEra = 9;
  S.visited = { kameral: 1, zentral: 1, foederal: 1, buerger: 1, npm: 1 };
  S.akten = 1e40;
  C.recalc();
  assert.ok(C.portalReady().ok);
  let fin = 0;
  U.on('finale', () => fin++);
  for (let i = 0; i < 10; i++) C.fundProject('portal');
  assert.equal(fin, 1);
  assert.ok(S.finale.done);
  assert.equal(C.fundProject('portal'), null);
  let delays = 0;
  for (let i = 0; i < 30 && !C.projState('flughafen').done; i++) { const r = C.fundProject('flughafen'); if (r && r.delayed) delays++; }
  assert.equal(delays, 7);
  assert.ok(C.projState('flughafen').done);
  assert.ok(S.forms[D.FORMS.find((f) => f.special).id]);
  U.clearHandlers();
});

/* ---------- Offline ---------- */
test('Offline-Ertrag mit Effizienz und Obergrenze', () => {
  C.init();
  const S = C.get();
  S.era = 1; S.gens.schreiber = 100; S.gens.siegel = 10;
  C.recalc();
  const sps = C.M.spsBase;
  const before = S.akten;
  const r = C.applyOffline(3600);
  assert.ok(Math.abs(r.gain - sps * 3600 * 0.6) / r.gain < 1e-6);
  assert.ok(Math.abs(S.akten - before - r.gain) / r.gain < 1e-6);
  const r2 = C.applyOffline(48 * 3600);
  assert.ok(r2.capped && r2.t === 8 * 3600);
});

/* ---------- Spielstand ---------- */
test('Speichern und Laden: Rundreise, Backups, Offline beim Laden', () => {
  for (const k in mem) delete mem[k];
  C.init();
  const S = C.get();
  for (let i = 0; i < 50; i++) C.eingang();
  C.buyGen('schreiber', 1);
  C.tick(5);
  assert.ok(C.save());
  const saved = JSON.parse(mem[C.SAVE_KEY]);
  assert.equal(saved.gens.schreiber, 1);
  assert.equal(C.listBackups().length, 1);
  now += 2 * 3600 * 1000;
  const info = C.load();
  assert.equal(info.fresh, false);
  assert.ok(info.offline && info.offline.gain > 0);
  assert.equal(C.get().gens.schreiber, 1);
});

test('Beschädigter Spielstand wird gesichert und aus Backup wiederhergestellt', () => {
  for (const k in mem) delete mem[k];
  C.init();
  for (let i = 0; i < 30; i++) C.eingang();
  C.save();
  mem[C.SAVE_KEY] = '{kaputt';
  const info = C.load();
  assert.equal(info.problem, 'corrupt');
  assert.ok(info.restored, 'aus Backup');
  assert.ok(Object.keys(mem).some((k) => k.startsWith('amtsschimmel.corrupt.')));
  assert.ok(C.get().stats.clicks >= 30);
});

test('Spielstand aus neuerer Version wird nicht überschrieben', () => {
  for (const k in mem) delete mem[k];
  mem[C.SAVE_KEY] = JSON.stringify({ v: 99, totalAkten: 5, gens: {} });
  const info = C.load();
  assert.equal(info.problem, 'future');
  assert.ok(Object.keys(mem).some((k) => k.startsWith('amtsschimmel.future.')));
});

test('Bereinigung ungültiger Werte und Migration von Version 0', () => {
  const st = C.fromObject({ paragraphs: 42, akten: 'viel', totalAkten: NaN, gens: { schreiber: 5, quatsch: 3, siegel: -2 }, ups: { st1: true, nix: true },
    leitbild: 'gibtsnicht', korb: { doc: { r: 99 } }, buffs: [{ k: 'prod', x: Infinity, end: 5 }, { k: 'prod', x: 2, end: 9 }], settings: { numFmt: 'falsch' } });
  assert.equal(st.vor, 42);
  assert.equal(st.akten, 0);
  assert.equal(st.totalAkten, 0);
  assert.deepEqual(st.gens, { schreiber: 5 });
  assert.deepEqual(st.ups, { st1: true });
  assert.equal(st.leitbild, 'kameral');
  assert.equal(st.korb.doc, null);
  assert.equal(st.buffs.length, 1);
  assert.equal(st.settings.numFmt, 'kurz');
  assert.equal(st.v, C.VERSION);
});

test('Export und Import mit Prüfsumme', () => {
  C.init();
  for (let i = 0; i < 15; i++) C.eingang();
  const str = C.exportStr();
  assert.ok(str.startsWith('AMT1:'));
  C.init();
  assert.equal(C.get().stats.clicks, 0);
  assert.ok(C.importStr(str).ok);
  assert.equal(C.get().stats.clicks, 15);
  assert.equal(C.importStr(str.slice(0, -3) + 'abc').ok, false);
  assert.equal(C.importStr('hallo').ok, false);
  const bad = 'AMT1:' + U.toB64('{"v":1}') + '.' + U.hash('{"v":1}');
  assert.equal(C.importStr(bad).ok, false);
});

/* ---------- Regressionen aus dem Review ---------- */
function exploitRun(wrongFirst, setup) {
  C.init();
  const S = C.get();
  S.era = 6; S.maxEra = 6; S.gens.schreiber = 100; S.gens.siegel = 100;
  setup(S);
  C.recalc();
  let actions = 0, earned = 0;
  const before = () => S.totalAkten;
  for (let i = 0; i < 3000; i++) {
    const d = C.doc();
    const t0 = before();
    if (wrongFirst && d.type !== 'wider' && S.korb.pending.length < 8) C.ressort((d.r + 1) % C.activeRessorts().length);
    else C.ressort(d.r);
    earned += before() - t0; actions++;
  }
  return earned / actions;
}
test('Absichtlich falsch stempeln lohnt sich nicht (außer in Schilda)', () => {
  const full = (S) => { S.ups.wi1 = true; S.ups.wi2 = true; S.paras.p22 = true; };
  const right = exploitRun(false, full), wrong = exploitRun(true, full);
  assert.ok(wrong < right, 'falsch ' + wrong + ' >= richtig ' + right);
  const early = exploitRun(true, (S) => {}), earlyRight = exploitRun(false, (S) => {});
  assert.ok(early < earlyRight, 'früh: falsch ' + early + ' >= richtig ' + earlyRight);
});
test('Eingangsstempel-Verbesserungen wirken auch im Spätspiel', () => {
  C.init();
  const S = C.get();
  S.era = 6; S.gens.grossrechner = 50; S.ups.st3 = true; S.ups.st4 = true;
  C.recalc();
  const v0 = C.M.clickVal;
  S.ups.st1 = true; C.recalc();
  assert.ok(C.M.clickVal > v0 * 1.9, 'Stempelkissen ×2 wirkt');
});
test('Volle Widerspruchs-Warteschlange: Akte bleibt liegen', () => {
  C.init();
  const S = C.get();
  C.earn(1e3); C.tick(1);
  while (C.doc().r < 0) C.eingang();
  for (let i = 0; i < 8; i++) S.korb.pending.push({ r: 0, type: 'wider', need: 2, prog: 0, title: 't', due: 1e9 });
  const d = C.doc();
  C.ressort((d.r + 1) % 2);
  assert.equal(C.doc().no, d.no, 'dieselbe Akte liegt noch da');
});
test('Offline: Automatik kauft ein, Vertretung stempelt mit', () => {
  C.init();
  const S = C.get();
  S.perks = { uebergangsgeld: true, stempelfest: true, fristgerecht: true, haushaltsautomatik: true, bestandsschutz1: true, formularkunde: true, personalautomatik: true, vertretungsplan: true };
  S.era = 2; S.gens.schreiber = 20; S.gens.siegel = 10;
  C.recalc();
  const n0 = C.totalGens();
  const r = C.applyOffline(4 * 3600);
  assert.ok(C.totalGens() > n0 + 20, 'Personalautomatik hat offline gekauft');
  assert.ok(r.gain > 0);
});
test('Neuerer Spielstand: Speichern gesperrt', () => {
  for (const k in mem) delete mem[k];
  mem[C.SAVE_KEY] = JSON.stringify({ v: 99, totalAkten: 5, gens: {} });
  C.readOnly = false; C.futureLock = false;
  C.load();
  assert.equal(C.save(), false);
  assert.equal(JSON.parse(mem[C.SAVE_KEY]).v, 99, 'Original unberührt');
  C.readOnly = false; C.futureLock = false;
});
test('Bereinigung: Projektstufe, Mitzeichnungsfolge, leere Formulare, Kaufmenge', () => {
  const st = C.fromObject({ projects: { flughafen: { stage: 99, delays: 50 } }, korb: { doc: { r: 1, need: 3, prog: 0, title: 'x', seq: [1, 9, 2] } },
    forms: { f0: 0, f1: 2 }, settings: { buyAmt: 'max', sfxVol: 7 } });
  assert.equal(st.projects.flughafen.stage, 5);
  assert.equal(st.projects.flughafen.delays, 7);
  assert.equal(st.korb.doc, null);
  assert.deepEqual(st.forms, { f1: 2 });
  assert.equal(st.settings.buyAmt, 'max');
  assert.equal(st.settings.sfxVol, 1);
});
test('Novellen erst nach allen Paragrafen, setzen bei Reform zurück', () => {
  C.init();
  const S = C.get();
  S.vor = 1e12;
  assert.equal(C.buyNovelle(), false);
  for (const p of D.PARAS) S.paras[p.id] = true;
  C.recalc();
  const before = C.M.staticG;
  assert.ok(C.buyNovelle());
  assert.ok(C.M.staticG > before * 1.09);
  S.totalAkten = 1e14; C.recalc();
  C.reform('zentral');
  assert.equal(S.novelle, 0);
});

/* ---------- Langlauf ohne NaN ---------- */
test('Langlauf in allen Leitbildern bleibt endlich', () => {
  for (const lb of D.LEITBILDER) {
    C.init();
    const S = C.get();
    S.flags.schilda = true; S.maxEra = 9; S.totalAkten = 1e30; S.dj = 1e6; S.perks = Object.fromEntries(D.PERKS.map((p) => [p.id, true]));
    C.recalc();
    C.reform(lb.id);
    for (let i = 0; i < 2000; i++) {
      C.tick(1);
      const d = C.doc();
      if (d.r >= 0) C.ressort(i % 7 === 0 ? (d.r + 1) % C.activeRessorts().length : d.r); else C.eingang();
      if (i % 10 === 0) { C.buyAllUpgrades(); for (const g of D.GENS) C.buyGen(g.id, 'max'); for (const p of D.PARAS) C.buyPara(p.id); }
      if (S.schimmel.active) C.catchSchimmel();
      if (S.anliegen.cur) C.answerAnliegen(1);
    }
    for (const k of ['akten', 'vor', 'totalAkten']) assert.ok(isFinite(S[k]) && S[k] >= 0, lb.id + ': ' + k + ' = ' + S[k]);
    assert.ok(isFinite(C.M.sps) && C.M.sps > 0, lb.id + ' sps');
    assert.ok(C.serialize().length < 200000, 'Spielstand bleibt klein');
  }
});

test('Urkunden prüfen ohne Fehler, Tipps werfen nicht', () => {
  C.init();
  const S = C.get();
  for (const a of D.ACH) a.check(S, C);
  for (const t of D.TIPS) t.when(S, C);
});

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
process.exit(failed ? 1 : 0);

// Balance-Simulation mit virtueller Zeit.
// Aufruf: node tools/sim.mjs [Stunden=12] [Profil=active|casual|clicker|abend|idle] [Seed=1]
//         node tools/sim.mjs lb          – vergleicht alle Leitbilder aus einem mittleren Spielstand
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const load = require('./load.cjs');
const AS = load();
const { U, D, Core: C } = AS;

const args = process.argv.slice(2);
const MODE = args[0] === 'lb' ? 'lb' : 'run';
const HOURS = MODE === 'lb' ? 1 : +(args[0] || 12);
const PROFILE = args[1] || 'active';
const SEED = +(args[2] || 1);
U.setRandom(U.mulberry32(SEED));

let now = Date.UTC(2026, 9, 5, 9, 0, 0);
C.now = () => now;
const fmtT = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${String(h).padStart(3)}h${String(m).padStart(2, '0')}`; };

const P = {
  active: { stampRate: 1.4, acc: 0.95, eingangRate: 0, catchP: 0.9, onFrac: 1, session: 0 },
  casual: { stampRate: 0.8, acc: 0.9, eingangRate: 1, catchP: 0.7, onMin: 10, offMin: 20 },
  idle: { stampRate: 0.5, acc: 0.85, eingangRate: 1, catchP: 0.6, onMin: 5, offMin: 180, offline: true },
  clicker: { stampRate: 0, acc: 1, eingangRate: 4, catchP: 0.8, onFrac: 1 },
  abend: { stampRate: 1, acc: 0.9, eingangRate: 0.5, catchP: 0.7, onMin: 60, offMin: 1380, offline: true },
}[PROFILE];

const log = [];
let t = 0;
U.on('era', (e) => log.push(`${fmtT(t)}  Epoche ${e.era}: ${D.ERAS[e.era].name}`));
U.on('reform', (r) => log.push(`${fmtT(t)}  REFORM #${C.get().stats.reforms} → ${D.LB[r.lb].name} +${U.fmt(r.gain)} DJ (gesamt ${U.fmt(C.get().dj)})`));
U.on('projDone', (r) => log.push(`${fmtT(t)}  Großprojekt fertig: ${D.PROJ[r.id].name}`));
U.on('finale', () => log.push(`${fmtT(t)}  *** FINALE ***`));

function isOn() {
  if (P.onFrac) return true;
  const min = t / 60;
  return (min % (P.onMin + P.offMin)) < P.onMin;
}

function bestLeitbild() {
  const S = C.get();
  const ids = D.LEITBILDER.filter((l) => !l.secret && C.leitbildUnlocked(l.id)).map((l) => l.id);
  const unvisited = ids.filter((id) => !S.visited[id]);
  if (unvisited.length) return unvisited[unvisited.length - 1];
  const pref = ['zentral', 'parkinson', 'digital', 'foederal', 'npm', 'entbuer', 'buerger', 'kameral'].filter((id) => ids.includes(id) && id !== S.leitbild);
  return pref[0] || 'kameral';
}

function spend() {
  const S = C.get();
  C.buyAllUpgrades();
  // Paragrafen: günstigste offene
  for (let k = 0; k < 10; k++) {
    const open = D.PARAS.filter((p) => C.paraState(p) === 'open').sort((a, b) => a.cost - b.cost);
    if (!open.length || C.paraCost(open[0]) > S.vor) break;
    C.buyPara(open[0].id);
  }
  // Gesetzesnovellen: nur, wenn danach noch genug Vorschriften für den Bonus übrig bleiben
  for (let k = 0; k < 5 && C.novelleOpen() && C.novelleCost() <= S.vor * 0.5; k++) C.buyNovelle();
  // Generatoren nach Amortisation
  for (let k = 0; k < 60; k++) {
    let best = null, bs = Infinity;
    const g0 = C.M.staticG * C.M.rechts;
    for (const g of D.GENS) {
      if (!C.genUnlocked(g)) continue;
      const c = C.genCost(g.id, 1);
      const sc = c / Math.max(C.M.unit[g.id] * g0, 1e-300) + Math.max(0, c - S.akten) / Math.max(C.M.sps, 1e-9);
      if (sc < bs) { bs = sc; best = { id: g.id, c }; }
    }
    if (!best || best.c > S.akten) break;
    C.buyGen(best.id, 1);
  }
  for (const g of D.GREMIEN) { if (S.era < g.era) continue; while (C.gremCost(g.id, 1) <= S.akten * 0.08) if (!C.buyGrem(g.id, 1)) break; }
  // Großprojekte
  for (const p of D.PROJECTS) {
    if (!C.projVisible(p.id)) continue;
    while (C.projCost(p.id) <= S.akten * (p.finale ? 1 : 0.5) && C.fundProject(p.id)) { /* weiter */ }
  }
  // Laufbahn
  for (let k = 0; k < 30; k++) {
    const open = D.PERKS.filter((p) => C.perkState(p) === 'open').sort((a, b) => a.cost - b.cost);
    if (open.length && open[0].cost <= S.pp) { C.buyPerk(open[0].id); continue; }
    if (!open.length && C.stufeCost() <= S.pp) { C.buyStufe(); continue; }
    break;
  }
}

let lastReformT = 0, allowReform = true;
function maybeReform() {
  if (!allowReform) return;
  const S = C.get();
  const g = C.djGain();
  const runT = t - lastReformT;
  if (g < 1 || runT < 600) return;
  const ratio = g / Math.max(1, S.dj);
  if (ratio >= 1 || (ratio >= 0.35 && runT > 2400) || (runT > 3 * 3600)) {
    if (S.era >= 9 && !S.finale.done && Object.keys(S.visited).length >= 5) {
      // aufs Finale sparen, wenn es in absehbarer Zeit erreichbar ist
      const need = C.projCost('portal');
      if (S.akten + C.M.sps * 3600 >= need || g < S.dj * 1.5) return;
    }
    C.reform(bestLeitbild());
    lastReformT = t;
  }
}

function simulate(seconds, report = true) {
  const S = C.get();
  const reportAt = [5, 10, 20, 30, 45, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720, 900, 1200, 1440, 2000, 2880].map((m) => m * 60);
  let stampAcc = 0, eingAcc = 0, pendingCatch = -1;
  U.on('schimmelSpawn', () => { if (U.rand() < P.catchP) pendingCatch = 1 + U.rand() * 3; });
  U.on('anliegen', (a) => { if (C.visible) C.answerAnliegen(U.randInt(0, a.opts.length - 1)); });
  while (t < seconds) {
    const on = isOn();
    if (P.offline && !on) {
      // Offline-Phase am Stück
      const cycle = (P.onMin + P.offMin) * 60;
      const off = P.offMin * 60;
      C.save && 0;
      now += off * 1000; t += off;
      C.applyOffline(off);
      spend(); maybeReform();
      continue;
    }
    C.visible = on;
    const dt = 1;
    if (on) {
      const doc = S.korb.doc;
      stampAcc += P.stampRate * dt;
      while (stampAcc >= 1) {
        stampAcc--;
        const d = C.get().korb.doc || C.doc();
        if (d.r < 0) C.eingang();
        else {
          const ok = U.rand() < P.acc;
          const rs = C.activeRessorts();
          C.ressort(ok ? d.r : rs[(rs.indexOf(d.r) + 1) % rs.length]);
        }
      }
      eingAcc += P.eingangRate * dt;
      while (eingAcc >= 1) { eingAcc--; C.eingang(); }
      if (pendingCatch > 0) { pendingCatch -= dt; if (pendingCatch <= 0) { C.catchSchimmel(); pendingCatch = -1; } }
    }
    C.tick(dt);
    now += dt * 1000; t += dt;
    if (t % 5 === 0) spend();
    if (t % 30 === 0) maybeReform();
    if (report && reportAt.length && t >= reportAt[0]) {
      reportAt.shift();
      const S2 = C.get();
      if (process.env.DEBUG) { const F = C.M.F; const top = D.GENS.filter((g) => S2.gens[g.id]).map((g) => [g.id, C.M.genSps[g.id]]).sort((a, b) => b[1] - a[1])[0];
        log.push(`        prodX ${U.mult(F.prodX)} add ${U.mult(1 + F.prodAdd + F.perGrem * C.M.gremEff)} dj ${U.mult(C.M.djMult)} rechts ${U.mult(C.M.rechts)} cat ${U.mult(F.cat.person)}/${U.mult(F.cat.sache)}/${U.mult(F.cat.technik)} top ${top && top[0]} genX ${top && U.mult(F.gen[top[0]] || 1)} n ${top && S2.gens[top[0]]} divers ${U.mult(C.M.divers)}`); }
      log.push(`${fmtT(t)}  -- E${S2.era} sps ${U.fmt(C.M.spsBase)}  run ${U.fmt(S2.runAkten)}  §/s ${U.fmt(C.M.vps, { dec: 2 })} § ${U.fmt(S2.vor)}  DJ ${U.fmt(S2.dj)}+${U.fmt(C.djGain())}  ups ${Object.keys(S2.ups).length} par ${Object.keys(S2.paras).length} perks ${Object.keys(S2.perks).length} st ${S2.stufe} ach ${Object.keys(S2.ach).length} forms ${Object.keys(S2.forms).length} anteil Stempel ${pct(stampShare())}`);
    }
  }
}
let earnedStamp = 0;
function hookStamps() {
  U.on('stamp', (e) => { earnedStamp += e.gain || 0; });
  U.on('docDone', (e) => { earnedStamp += e.bonus || 0; });
}
hookStamps();
let lastRun = 0, lastStamp = 0;
function stampShare() {
  const S = C.get();
  const total = S.totalAkten - lastRun, st = earnedStamp - lastStamp;
  lastRun = S.totalAkten; lastStamp = earnedStamp;
  return total > 0 ? st / total : 0;
}
const pct = (x) => Math.round(x * 100) + ' %';

if (MODE === 'run') {
  C.init();
  simulate(HOURS * 3600);
  const S = C.get();
  console.log(log.join('\n'));
  console.log(`\nEnde ${fmtT(t)}: Epoche ${S.era} (max ${S.maxEra}), Reformen ${S.stats.reforms}, DJ ${U.fmt(S.dj)}, PP ${U.fmt(S.pp)}, Leitbilder ${Object.keys(S.visited).join(',')}`);
  console.log(`Urkunden ${Object.keys(S.ach).length}/${D.ACH.length}, Formulare ${Object.keys(S.forms).length}/${D.FORMS.length}, Schimmel ${S.stats.schimmel}, Anliegen ${S.stats.anliegen}, Docs ${S.stats.docs}, Finale ${S.finale.done}`);
  console.log('Epochen erstmals (Spielzeit):', JSON.stringify(Object.fromEntries(Object.entries(S.stats.eraTimes).map(([k, v]) => [k, fmtT(v).trim()]))));
} else {
  // Leitbild-Vergleich: Spielstand aus 6 h aktivem Spiel, dann je 1 h mit jedem Leitbild
  C.init();
  simulate(6 * 3600, false);
  const base = JSON.parse(C.serialize());
  base.flags.schilda = true;
  base.maxEra = Math.max(base.maxEra, 7);
  const res = [];
  for (const lb of D.LEITBILDER) {
    U.clearHandlers();
    hookStamps();
    U.setRandom(U.mulberry32(SEED));
    const st = JSON.parse(JSON.stringify(base));
    C.init(st);
    // Reform in das Leitbild erzwingen
    const S0 = C.get();
    S0.visited = { kameral: 1 };
    S0.leitbild = 'kameral';
    S0.streak = 0;
    S0.dj = Math.max(0, C.djTotalFor(S0.totalAkten) - 1);
    C.recalc();
    C.reform(lb.id);
    stampShare();
    t = 0; lastReformT = 0; allowReform = false;
    simulate(3600, false);
    const S = C.get();
    res.push([lb.name, S.runAkten, S.era, stampShare()]);
  }
  res.sort((a, b) => b[1] - a[1]);
  for (const [n, a, e, sh] of res) console.log(n.padEnd(26), U.fmt(a).padStart(14), ' Epoche', e, ' Stempelanteil', pct(sh));
}

'use strict';
/* Amtsschimmel – Spiellogik ohne DOM. Läuft im Browser und in Node (tools/sim.mjs, tools/test.mjs).
   Kommunikation nach außen nur über AS.U.emit(…) und die öffentlichen Funktionen in AS.Core. */
(function (root) {
  const AS = root.AS;
  const U = AS.U, D = AS.D;
  const C = (AS.Core = {});

  /* ---------- Konstanten ---------- */
  C.VERSION = 1;
  C.SAVE_KEY = 'amtsschimmel.save';
  C.BACKUP_KEY = 'amtsschimmel.backups';
  const GROWTH = 1.15, GREM_GROWTH = 1.2;
  const BASE_FLOW_MAX = 10, FLOW_STEP = 0.03, FLOW_HOLD = 3, FLOW_DECAY = 3;
  const RESSORT_FACTOR = 2.5;
  const EINGANG_PROG = 0.2;
  const AUTO_SHARE = 0.25, AUTO_IDLE = 3;
  const EILT_CHANCE = 0.07, EILT_TIME = 8, GROSS_CHANCE = 0.05, FORM_CHANCE = 0.005;
  const SCHIMMEL_MIN = 150, SCHIMMEL_MAX = 330, SCHIMMEL_LIFE = 13;
  const ANL_MIN = 240, ANL_MAX = 480, ANL_WAIT = 90;
  const DJ_DIV = 1e11, DJ_EFFECT = 0.02;
  const OFF_EFF = 0.6, OFF_CAP = 8;
  const CHAOS = [0.25, 0.5, 0.75, 1, 1.5, 2, 4];
  const MUEDE = 0.15, FIRST_VISIT = 0.05, NOVELLE_X = 1.1, NOVELLE_BASE = 3e6, NOVELLE_GROWTH = 10;
  C.CONST = { GROWTH, GREM_GROWTH, DJ_DIV, DJ_EFFECT, RESSORT_FACTOR, FLOW_STEP, AUTO_SHARE };

  C.now = () => Date.now();
  C.visible = true;   // Schimmel und Anliegen erscheinen nur, wenn jemand hinschaut
  C.storage = null;   // { get(k), set(k, v), remove(k) } – vom Browser gesetzt
  let S = null;
  const M = (C.M = {}); // abgeleitete Werte

  /* ---------- Spielstand ---------- */
  function newState() {
    const t = C.now();
    return {
      v: C.VERSION, created: t, lastSave: t, gt: 0,
      akten: 0, runAkten: 0, totalAkten: 0,
      vor: 0, runVor: 0, totalVor: 0, novelle: 0,
      gens: {}, grem: {}, ups: {}, paras: {},
      era: 0, maxEra: 0,
      korb: { doc: null, pending: [], flow: 0, lastCorrect: -99, lastManual: -99, docNo: 0, autoAcc: 0, wrongStreak: 0 },
      buffs: [],
      schimmel: { in: 90, active: false, until: 0, born: 0 },
      anliegen: { in: 200, cur: null, until: 0, recent: [] },
      projects: {},
      dj: 0, pp: 0, perks: {}, stufe: 0,
      leitbild: 'kameral', visited: { kameral: 1 }, streak: 0,
      forms: {}, ach: {},
      finale: { done: false, at: 0, seen: false },
      stats: {
        clicks: 0, stamps: 0, correct: 0, wrong: 0, auto: 0, docs: 0, eilt: 0, eiltMissed: 0, wider: 0, gross: 0,
        schimmel: 0, schimmelMissed: 0, anliegen: 0, reforms: 0, maxFlow: 0, maxSps: 0, maxSpsBase: 0,
        playTime: 0, bestRun: 0, formsFound: 0, altpapier: 0, offlineAkten: 0, eraTimes: {},
      },
      run: { start: t, gt: 0, clicks: 0, correct: 0, docs: 0, schimmel: 0 },
      settings: {
        sound: true, music: true, sfxVol: 0.7, musicVol: 0.4, numFmt: 'kurz', motion: 'auto',
        autoUp: true, autoGen: true, ticker: true, buyAmt: '1', tips: true,
      },
      flags: {}, tips: {}, lastBackup: 0,
    };
  }
  C.newState = newState;
  C.get = () => S;

  /* ---------- Effekte sammeln ---------- */
  function baseF() {
    return {
      gen: {}, cat: { person: 1, sache: 1, technik: 1 }, prodX: 1, prodAdd: 0, perGrem: 0,
      clickX: 1, clickPct: 0, stampX: 1, flowMax: BASE_FLOW_MAX, flowDecay: 1,
      eiltX: 1, eiltFreq: 1, eiltTime: 0, widerX: 1, formRate: 1,
      schimFreq: 1, schimDur: 1, schimLife: 0, anlFreq: 1, anlRew: 1, luckyX: 1,
      vX: 1, parkinson: 0.5, noParkinson: false, rechtsX: 1,
      cost: 1, upCost: 1, paraCost: 1, projCost: 1, offEff: OFF_EFF, offCap: OFF_CAP,
      auto: 0, djX: 1, djGain: 1, syn: [], flatPer: {}, assist: false, ressortMax: 6, divers: null, chaos: false, flags: {},
    };
  }
  function applyFx(F, list) {
    if (!list) return;
    for (const e of list) {
      switch (e.t) {
        case 'gen': F.gen[e.id] = (F.gen[e.id] || 1) * e.x; break;
        case 'cat':
          if (e.cat === 'all') { F.cat.person *= e.x; F.cat.sache *= e.x; F.cat.technik *= e.x; } else F.cat[e.cat] *= e.x;
          break;
        case 'prod': F.prodX *= e.x; break;
        case 'prodAdd': F.prodAdd += e.a; break;
        case 'perGrem': F.perGrem += e.a; break;
        case 'click': F.clickX *= e.x; break;
        case 'clickPct': F.clickPct += e.a; break;
        case 'stamp': F.stampX *= e.x; break;
        case 'flowMax': F.flowMax += e.a; break;
        case 'flowDecay': F.flowDecay *= e.x; break;
        case 'eilt': F.eiltX *= e.x; break;
        case 'eiltFreq': F.eiltFreq *= e.x; break;
        case 'eiltTime': F.eiltTime += e.a; break;
        case 'wider': F.widerX *= e.x; break;
        case 'formRate': F.formRate *= e.x; break;
        case 'schimFreq': F.schimFreq *= e.x; break;
        case 'schimDur': F.schimDur *= e.x; break;
        case 'schimLife': F.schimLife += e.a; break;
        case 'anlFreq': F.anlFreq *= e.x; break;
        case 'anlRew': F.anlRew *= e.x; break;
        case 'lucky': F.luckyX *= e.x; break;
        case 'v': F.vX *= e.x; break;
        case 'parkinson': F.parkinson += e.a; break;
        case 'noParkinson': F.noParkinson = true; break;
        case 'rechts': F.rechtsX *= e.x; break;
        case 'cost': F.cost *= e.x; break;
        case 'upCost': F.upCost *= e.x; break;
        case 'paraCost': F.paraCost *= e.x; break;
        case 'projCost': F.projCost *= e.x; break;
        case 'offEff': F.offEff += e.a; break;
        case 'offCap': F.offCap += e.a; break;
        case 'auto': F.auto += e.a; break;
        case 'dj': F.djX *= e.x; break;
        case 'djGain': F.djGain *= e.x; break;
        case 'syn': F.syn.push(e); break;
        case 'flatPer': F.flatPer[e.id] = (F.flatPer[e.id] || 0) + e.a; break;
        case 'assist': F.assist = true; break;
        case 'ressortMax': F.ressortMax = Math.min(F.ressortMax, e.n); break;
        case 'divers': F.divers = e; break;
        case 'chaos': F.chaos = true; break;
        case 'flag': F.flags[e.f] = true; break;
        default: break;
      }
    }
  }

  C.totalGens = () => { let n = 0; for (const k in S.gens) n += S.gens[k]; return n; };
  C.totalGrem = () => { let n = 0; for (const k in S.grem) n += S.grem[k]; return n; };
  C.ordnerComplete = function () {
    let n = 0;
    for (const o of D.ORDNER) if (D.FORMS.every((f) => f.ordner !== o.id || S.forms[f.id])) n++;
    return n;
  };
  C.isOrdnerComplete = (oid) => D.FORMS.every((f) => f.ordner !== oid || S.forms[f.id]);
  C.duplicateForms = () => { let n = 0; for (const k in S.forms) n += Math.max(0, S.forms[k] - 1); return n; };
  C.visitedCount = () => Object.keys(S.visited).length;

  /** Alles Statische neu berechnen (nach Käufen, Reformen, Urkunden …) */
  C.recalc = function () {
    const F = baseF();
    for (const id in S.ups) if (D.UP[id]) applyFx(F, D.UP[id].fx);
    for (const id in S.paras) if (D.PARA[id]) applyFx(F, D.PARA[id].fx);
    for (const id in S.perks) if (D.PERK[id]) applyFx(F, D.PERK[id].fx);
    const lb = D.LB[S.leitbild] || D.LB.kameral;
    applyFx(F, lb.fx);
    for (const id in S.forms) { const f = D.FORM[id]; if (f) F.prodAdd += D.RARITY[f.r].bonus; }
    for (const o of D.ORDNER) if (C.isOrdnerComplete(o.id)) applyFx(F, o.fx);
    F.prodAdd += 0.01 * Object.keys(S.ach).length;
    F.prodX *= Math.pow(1 + FIRST_VISIT, Math.max(0, Object.keys(S.visited).length - 1));
    for (const p of D.PROJECTS) if (S.projects[p.id] && S.projects[p.id].done) applyFx(F, p.fx);
    if (S.finale.done) F.prodX *= 2;
    if (S.stufe) F.prodX *= Math.pow(1 + D.STUFE.bonus, S.stufe);
    M.F = F;

    const total = C.totalGens();
    M.unit = {};
    for (const g of D.GENS) {
      const n = S.gens[g.id] || 0;
      const base = g.prod + (F.flatPer[g.id] || 0) * (total - n);
      let syn = 0;
      for (const s of F.syn) if (s.id === g.id) syn += s.a * (S.gens[s.src] || 0);
      M.unit[g.id] = base * (F.gen[g.id] || 1) * F.cat[g.cat] * (1 + syn);
    }
    let divers = 1;
    if (F.divers) {
      let k = 0;
      for (const g of D.GENS) if ((S.gens[g.id] || 0) >= F.divers.min) k++;
      divers = 1 + F.divers.a * k;
    }
    M.divers = divers;
    M.djMult = 1 + DJ_EFFECT * S.dj * F.djX;
    M.muede = F.flags.noMuede ? 1 : 1 - MUEDE * S.streak;
    // Gremien-Bonus mit abnehmendem Ertrag: volle Wirkung für die ersten 25, danach mit der Wurzel
    const ng = C.totalGrem();
    M.gremEff = ng <= 25 ? ng : 25 + 5 * (Math.sqrt(ng) - 5);
    M.gremMult = 1 + F.perGrem * M.gremEff;
    M.staticG = F.prodX * (1 + F.prodAdd) * M.gremMult * M.djMult * M.muede * divers * Math.pow(NOVELLE_X, S.novelle || 0);
    M.ressorts = C.activeRessorts();
    C.dyn();
  };

  /** Dynamische Werte (Buffs, Vorschriften-Bonus) – jeden Tick */
  C.dyn = function () {
    const F = M.F;
    M.rechts = 1 + 0.03 * Math.log2(1 + S.vor) * F.rechtsX;
    let prodBuff = 1, clickBuff = 1, stampBuff = 1, costBuff = 1;
    const genBuff = {};
    for (const b of S.buffs) {
      if (b.k === 'prod') prodBuff *= b.x;
      else if (b.k === 'click') clickBuff *= b.x;
      else if (b.k === 'stamp') stampBuff *= b.x;
      else if (b.k === 'cost') costBuff *= b.x;
      else if (b.k === 'gen') genBuff[b.gen] = (genBuff[b.gen] || 1) * b.x;
    }
    M.chaos = F.chaos ? (S.flags.chaosX || 1) : 1;
    const g0 = M.staticG * M.rechts * M.chaos;
    let base = 0, buffed = 0;
    M.genSps = {};
    for (const g of D.GENS) {
      const n = S.gens[g.id] || 0;
      if (!n) { M.genSps[g.id] = 0; continue; }
      const v = n * M.unit[g.id] * g0;
      base += v;
      const vb = v * (genBuff[g.id] || 1);
      M.genSps[g.id] = vb * prodBuff;
      buffed += vb;
    }
    M.spsBase = base;
    M.sps = buffed * prodBuff;
    M.prodBuff = prodBuff; M.clickBuff = clickBuff; M.stampBuff = stampBuff; M.costBuff = costBuff; M.genBuff = genBuff;
    // Vorschriften
    let v = 0;
    for (const g of D.GREMIEN) v += (S.grem[g.id] || 0) * g.vps;
    M.parkinson = F.noParkinson ? 1 : 1 + F.parkinson * Math.log10(1 + S.vor);
    M.vps = v * F.vX * M.parkinson;
    // Stempel
    // Ein Stempel ist (1 + Anteil der Produktion) × Stempelmultiplikator wert;
    // der Ressortstempel ist immer ein Vielfaches davon (Ressortfaktor × Ressortmultiplikator × Arbeitsfluss).
    const stampUnit = (1 + F.clickPct * M.sps) * F.clickX;
    M.clickVal = stampUnit * clickBuff;
    M.flowMult = 1 + FLOW_STEP * Math.floor(S.korb.flow);
    M.stampBase = stampUnit * RESSORT_FACTOR * F.stampX;
    M.stampVal = M.stampBase * stampBuff * clickBuff * M.flowMult;
    M.autoVal = M.stampBase * AUTO_SHARE;
  };

  /* ---------- Hilfen ---------- */
  function earn(x) {
    if (!(x > 0) || !isFinite(x)) return;
    S.akten += x; S.runAkten += x; S.totalAkten += x;
  }
  C.earn = earn;
  C.activeRessorts = function () {
    const n = Math.min(D.ERAS[S.era].ressorts, M.F ? M.F.ressortMax : 6);
    const out = [];
    for (let i = 0; i < n; i++) out.push(i);
    return out;
  };
  const eraFor = (run) => { let e = 0; for (let i = 0; i < D.ERAS.length; i++) if (run >= D.ERAS[i].at) e = i; return e; };
  C.nextEraAt = () => (S.era + 1 < D.ERAS.length ? D.ERAS[S.era + 1].at : null);

  /* ---------- Kaufen ---------- */
  C.genUnlocked = (g) => S.era >= g.era;
  C.genCost = function (id, n) {
    const g = D.GEN[id];
    n = n || 1;
    const own = S.gens[id] || 0;
    const first = g.cost * Math.pow(GROWTH, own) * M.F.cost * M.costBuff;
    return n === 1 ? first : first * (Math.pow(GROWTH, n) - 1) / (GROWTH - 1);
  };
  C.maxBuy = function (id, budget) {
    const first = C.genCost(id, 1);
    budget = budget === undefined ? S.akten : budget;
    if (budget < first) return 0;
    return Math.max(1, Math.floor(Math.log(budget * (GROWTH - 1) / first + 1) / Math.log(GROWTH)));
  };
  C.buyGen = function (id, amount) {
    const g = D.GEN[id];
    if (!g || !C.genUnlocked(g)) return 0;
    if (amount === 'max') amount = C.maxBuy(id);
    amount = Math.floor(amount || 0);
    if (amount < 1) return 0;
    const cost = C.genCost(id, amount);
    if (cost > S.akten * (1 + 1e-12)) return 0;
    S.akten = Math.max(0, S.akten - cost);
    S.gens[id] = (S.gens[id] || 0) + amount;
    C.recalc();
    U.emit('buy', { id, amount });
    return amount;
  };
  C.gremCost = function (id, n) {
    const g = D.GREM[id];
    n = n || 1;
    const own = S.grem[id] || 0;
    const first = g.cost * Math.pow(GREM_GROWTH, own) * M.F.cost * M.costBuff;
    return n === 1 ? first : first * (Math.pow(GREM_GROWTH, n) - 1) / (GREM_GROWTH - 1);
  };
  C.maxBuyGrem = function (id, budget) {
    const first = C.gremCost(id, 1);
    budget = budget === undefined ? S.akten : budget;
    if (budget < first) return 0;
    return Math.max(1, Math.floor(Math.log(budget * (GREM_GROWTH - 1) / first + 1) / Math.log(GREM_GROWTH)));
  };
  C.buyGrem = function (id, amount) {
    const g = D.GREM[id];
    if (!g || S.era < g.era) return 0;
    if (amount === 'max') amount = C.maxBuyGrem(id);
    amount = Math.floor(amount || 0);
    if (amount < 1) return 0;
    const cost = C.gremCost(id, amount);
    if (cost > S.akten * (1 + 1e-12)) return 0;
    S.akten = Math.max(0, S.akten - cost);
    S.grem[id] = (S.grem[id] || 0) + amount;
    C.recalc();
    U.emit('buyGrem', { id, amount });
    return amount;
  };

  function reqMet(r) {
    if (!r) return true;
    const st = S.stats;
    if (r.gen && (S.gens[r.gen] || 0) < r.n) return false;
    if (r.gen2 && (S.gens[r.gen2] || 0) < r.n2) return false;
    if (r.clicks && st.clicks < r.clicks) return false;
    if (r.correct && st.correct < r.correct) return false;
    if (r.flow && st.maxFlow < r.flow) return false;
    if (r.eilt && st.eilt < r.eilt) return false;
    if (r.wider && st.wider < r.wider) return false;
    if (r.forms && Object.keys(S.forms).length < r.forms) return false;
    if (r.schimmel && st.schimmel < r.schimmel) return false;
    if (r.grem && C.totalGrem() < r.grem) return false;
    return true;
  }
  C.upCost = (u) => u.cost * M.F.upCost;
  C.upVisible = (u) => !S.ups[u.id] && S.era >= u.era && reqMet(u.req);
  C.availableUpgrades = function () {
    const out = [];
    for (const u of D.UPGRADES) if (C.upVisible(u)) out.push(u);
    out.sort((a, b) => a.cost - b.cost);
    return out;
  };
  C.buyUpgrade = function (id) {
    const u = D.UP[id];
    if (!u || !C.upVisible(u)) return false;
    const cost = C.upCost(u);
    if (cost > S.akten * (1 + 1e-12)) return false;
    S.akten = Math.max(0, S.akten - cost);
    S.ups[id] = true;
    C.recalc();
    U.emit('upgrade', { id });
    return true;
  };
  C.buyAllUpgrades = function () {
    let n = 0;
    for (const u of C.availableUpgrades()) { if (C.upCost(u) <= S.akten) { if (C.buyUpgrade(u.id)) n++; } else break; }
    return n;
  };

  /* ---------- Paragrafen ---------- */
  C.paraCost = (p) => p.cost * M.F.paraCost;
  C.paraState = function (p) {
    if (S.paras[p.id]) return 'owned';
    if (p.req && !S.paras[p.req]) return 'locked';
    return 'open';
  };
  C.paraUnlocked = () => S.era >= 1 || S.vor > 0 || Object.keys(S.paras).length > 0;
  C.buyPara = function (id) {
    const p = D.PARA[id];
    if (!p || C.paraState(p) !== 'open') return false;
    const cost = C.paraCost(p);
    if (cost > S.vor * (1 + 1e-12)) return false;
    S.vor = Math.max(0, S.vor - cost);
    S.paras[id] = true;
    C.recalc();
    U.emit('para', { id });
    return true;
  };

  /** Gesetzesnovellen: nach allen Paragrafen endlos, je +10 % Produktion im Durchgang */
  C.novelleOpen = () => D.PARAS.every((p) => S.paras[p.id]);
  C.novelleCost = () => NOVELLE_BASE * Math.pow(NOVELLE_GROWTH, S.novelle || 0) * M.F.paraCost;
  C.buyNovelle = function () {
    if (!C.novelleOpen()) return false;
    const c = C.novelleCost();
    if (c > S.vor * (1 + 1e-12)) return false;
    S.vor = Math.max(0, S.vor - c);
    S.novelle = (S.novelle || 0) + 1;
    C.recalc();
    U.emit('para', { id: 'novelle' });
    return true;
  };
  C.NOVELLE_X = NOVELLE_X;

  /* ---------- Eingangskorb ---------- */
  function senderFor() {
    if (S.era < 4) return { who: U.pick(D.SENDERS[S.era]), place: '' };
    return { who: U.pick(D.SENDERS_MODERN), place: U.pick(D.PLACES) };
  }
  function newDoc() {
    const K = S.korb;
    let d = null;
    const idx = K.pending.findIndex((p) => p.due <= K.docNo);
    if (idx >= 0) d = K.pending.splice(idx, 1)[0];
    if (!d) {
      const rs = M.ressorts || C.activeRessorts();
      const r = rs.length ? U.pick(rs) : -1;
      d = { r, type: 'normal', need: 1, prog: 0 };
      if (rs.length >= 3 && S.era >= 4 && U.rand() < GROSS_CHANCE) {
        const seq = U.shuffle(rs).slice(0, 3);
        d = { r: seq[0], seq, type: 'gross', need: 3, prog: 0 };
      } else if (rs.length && S.era >= 2 && U.rand() < EILT_CHANCE * M.F.eiltFreq) {
        d.type = 'eilt';
        d.deadline = S.gt + EILT_TIME + M.F.eiltTime;
        d.dur = EILT_TIME + M.F.eiltTime;
      }
      const key = d.r < 0 ? 'none' : D.RESSORTS[d.r].id;
      d.title = U.pick(D.TITLES[key]);
      const s = senderFor();
      d.who = s.who; d.place = s.place;
      d.az = U.randInt(10, 99) + '-' + U.randInt(100, 999) + '/' + String(U.randInt(0, 99)).padStart(2, '0');
    }
    K.docNo++;
    d.no = K.docNo;
    d.stamps = 0;
    K.doc = d;
    U.emit('docNew', d);
    return d;
  }
  C.doc = () => S.korb.doc || newDoc();

  function typeMult(d) {
    if (d.type === 'wider') return 0.5 * M.F.widerX;
    if (d.type === 'eilt') return S.gt <= d.deadline ? 4 * M.F.eiltX : 1;
    if (d.type === 'gross') return 4;
    return 0;
  }
  function finishDoc(d, how) {
    const K = S.korb;
    let bonus = M.clickVal;
    const tm = typeMult(d);
    // Der Sonderbonus richtet sich nach dem letzten Stempel: Vertretung und Eingangsstempel zahlen weniger
    if (tm > 0) bonus += (how === 'auto' ? M.autoVal : how === 'eingang' ? M.clickVal : M.stampVal) * tm;
    earn(bonus);
    S.stats.docs++; S.run.docs++;
    if (d.type === 'wider') S.stats.wider++;
    if (d.type === 'gross') S.stats.gross++;
    if (d.type === 'eilt' && S.gt <= d.deadline) S.stats.eilt++;
    let form = null;
    const fc = FORM_CHANCE * M.F.formRate * (d.type === 'normal' ? 1 : 2);
    if (U.rand() < fc) form = rollForm();
    U.emit('docDone', { d, bonus, form, how });
    K.doc = null;
    newDoc();
  }
  function stampTimeFlags() {
    const dt = new Date(C.now());
    const h = dt.getHours(), m = dt.getMinutes();
    if (h < 4) S.flags.nacht = true;
    if (h === 12 && m < 5) S.flags.mittag = true;
    if (dt.getDay() === 1 && h < 8) S.flags.montag = true;
  }

  /** Eingangsstempel: immer erlaubt, kleiner Ertrag, 5 Stempel schließen einen Vorgang */
  C.eingang = function (auto) {
    const K = S.korb;
    const d = K.doc || newDoc();
    const gain = auto ? M.autoVal * 0.5 : M.clickVal;
    earn(gain);
    if (!auto) {
      S.stats.clicks++; S.run.clicks++; K.lastManual = S.gt; stampTimeFlags();
    } else S.stats.auto++;
    d.stamps++;
    d.prog = Math.min(d.need, d.prog + EINGANG_PROG);
    if (d.seq) d.r = d.seq[Math.min(d.seq.length - 1, Math.floor(d.prog + 1e-9))];
    U.emit('stamp', { kind: auto ? 'auto' : 'eingang', gain, d });
    if (d.prog >= d.need - 1e-9) finishDoc(d, 'eingang');
    return gain;
  };

  /** Ressortstempel: richtig = großer Ertrag + Arbeitsfluss, falsch = Widerspruch */
  C.ressort = function (r, auto) {
    const K = S.korb;
    const d = K.doc || newDoc();
    if (d.r < 0) return C.eingang(auto);
    if (!auto) { S.stats.stamps++; K.lastManual = S.gt; stampTimeFlags(); }
    if (r === d.r) {
      let gain;
      if (auto) { gain = M.autoVal; S.stats.auto++; }
      else {
        K.flow = Math.min(M.F.flowMax, Math.floor(K.flow) + 1);
        K.lastCorrect = S.gt;
        K.wrongStreak = 0;
        if (K.flow > S.stats.maxFlow) S.stats.maxFlow = K.flow;
        S.stats.correct++; S.run.correct++;
        C.dyn();
        gain = M.stampVal;
      }
      earn(gain);
      d.stamps++;
      d.prog = Math.min(d.need, Math.floor(d.prog + 1e-9) + 1);
      U.emit('stamp', { kind: auto ? 'auto' : 'correct', gain, d, flow: K.flow });
      if (d.prog >= d.need - 1e-9) finishDoc(d, auto ? 'auto' : 'ressort');
      else if (d.seq) { d.r = d.seq[Math.floor(d.prog + 1e-9)]; U.emit('docStep', d); }
      return gain;
    }
    // falscher Stempel
    S.stats.wrong++;
    K.flow = 0;
    K.wrongStreak++;
    if (K.wrongStreak >= 10) S.flags.querulant = true;
    if (K.pending.length >= 8) { // Eingang voll: die Akte bleibt liegen
      U.emit('stamp', { kind: 'wrong', gain: 0, d, r, kept: true });
      C.dyn();
      return 0;
    }
    K.pending.push({ r: d.r, type: 'wider', need: 2, prog: 0, title: d.title, who: d.who, place: d.place, az: d.az, due: K.docNo + 3, wrongR: r });
    U.emit('stamp', { kind: 'wrong', gain: 0, d, r });
    K.doc = null;
    newDoc();
    C.dyn();
    return 0;
  };

  /* ---------- Formulare ---------- */
  function rollForm() {
    const pool = D.FORMS.filter((f) => !f.special && f.era <= S.maxEra);
    const rar = U.weighted(Object.keys(D.RARITY), (k) => D.RARITY[k].w);
    let cand = pool.filter((f) => f.r === rar);
    if (!cand.length) cand = pool;
    const f = U.pick(cand);
    return giveForm(f.id);
  }
  function giveForm(id) {
    const isNew = !S.forms[id];
    S.forms[id] = (S.forms[id] || 0) + 1;
    S.stats.formsFound++;
    if (isNew) C.recalc();
    const res = { id, isNew, form: D.FORM[id] };
    U.emit('form', res);
    return res;
  }
  C.giveForm = giveForm;
  C.altpapier = function () {
    let n = 0;
    for (const k in S.forms) if (S.forms[k] > 1) { n += S.forms[k] - 1; S.forms[k] = 1; }
    if (!n) return 0;
    const gain = Math.max(100, M.spsBase * 120) * n;
    earn(gain);
    S.stats.altpapier += n;
    U.emit('altpapier', { n, gain });
    return gain;
  };

  /* ---------- Buffs ---------- */
  function addBuff(b) {
    const ex = S.buffs.find((x) => x.id === b.id);
    if (ex) { ex.end = Math.max(ex.end, S.gt + b.s); ex.dur = Math.max(ex.dur, b.s); }
    else S.buffs.push({ id: b.id, k: b.k, x: b.x, gen: b.gen, name: b.name, end: S.gt + b.s, dur: b.s });
    C.dyn();
    U.emit('buff', b);
  }
  C.addBuff = addBuff;

  /* ---------- Amtsschimmel ---------- */
  function scheduleSchimmel() { S.schimmel.in = U.range(SCHIMMEL_MIN, SCHIMMEL_MAX) / M.F.schimFreq; }
  C.schimmelSoon = () => { if (!S.schimmel.active) S.schimmel.in = Math.min(S.schimmel.in, 6); };
  C.catchSchimmel = function () {
    const sc = S.schimmel;
    if (!sc.active) return null;
    sc.active = false;
    if (S.gt - sc.born <= 1) S.flags.sprint = true;
    S.stats.schimmel++; S.run.schimmel++;
    const list = D.SCHIMMEL.filter((e) => (!e.minEra || S.era >= e.minEra) && (!e.minGens || C.totalGens() > 0) && (!e.minVps || M.vps > 0));
    const e = U.weighted(list, (x) => x.w);
    const res = { id: e.id, name: e.name, text: e.text };
    if (e.buff) {
      const b = Object.assign({ id: 's_' + e.id, name: e.name }, e.buff);
      b.s = e.buff.s * M.F.schimDur;
      const t = U.fmtTime(b.s);
      const dur = ' für ' + t + (t.endsWith('.') ? '' : '.');
      if (b.k === 'gen') {
        const owned = D.GENS.filter((g) => S.gens[g.id]);
        const g = U.pick(owned);
        b.gen = g.id; b.id = 's_gen_' + g.id; b.name = 'Beförderung: ' + g.plural;
        res.text = g.plural + ' arbeiten ' + U.mult(b.x) + dur;
      } else {
        const what = { prod: 'Produktion ' + U.mult(b.x), click: 'Alle Stempel ' + U.mult(b.x), cost: 'Generatoren und Gremien zum halben Preis' }[b.k];
        res.text = e.text + ' ' + what + dur;
      }
      addBuff(b);
      res.buff = b;
    }
    if (e.lucky) {
      const gain = (Math.min(S.akten * 0.15, M.spsBase * 900) + 13) * M.F.luckyX;
      earn(gain);
      res.gain = gain;
      res.text = 'Im Haushalt war noch etwas übrig: +' + U.fmt(gain) + ' Akten.';
    }
    if (e.vor) {
      const g = Math.max(5, M.vps * e.vor);
      S.vor += g; S.runVor += g; S.totalVor += g;
      res.vor = g;
      res.text = 'Ein Gremium tagt die Nacht durch: +' + U.fmt(g) + ' Vorschriften.';
    }
    scheduleSchimmel();
    U.emit('schimmel', res);
    return res;
  };

  /* ---------- Bürgeranliegen ---------- */
  function scheduleAnliegen() { S.anliegen.in = U.range(ANL_MIN, ANL_MAX) / M.F.anlFreq; }
  function pickAnliegen() {
    const A = S.anliegen;
    const ok = D.ANLIEGEN.filter((a) => (a.minEra === undefined || S.era >= a.minEra) && (a.maxEra === undefined || S.era <= a.maxEra) &&
      A.recent.indexOf(a.id) < 0 && !(a.id === 'schilda' && S.flags.schilda) && !(a.id === 'unterausschuss' && !C.totalGrem()));
    if (!ok.length) return null;
    return U.weighted(ok, (a) => (a.rare ? 0.25 : 1));
  }
  function applyAnlFx(fx, out) {
    const F = M.F;
    const rew = F.anlRew;
    if (fx.akten) { const g = Math.max(M.clickVal * 20, M.spsBase * 60 * fx.akten) * rew; earn(g); out.push('+' + U.fmt(g) + ' Akten'); }
    if (fx.vor) {
      const g = Math.max(3 * fx.vor / 10, M.vps * 60 * fx.vor) * rew;
      S.vor += g; S.runVor += g; S.totalVor += g; out.push('+' + U.fmt(g, { dec: 1 }) + ' Vorschriften');
    }
    const timed = (k, arr, name) => {
      const x = arr[0] >= 1 ? 1 + (arr[0] - 1) * rew : arr[0];
      addBuff({ id: 'a_' + k + '_' + U.randInt(0, 1e6), k, x, s: arr[1], name });
      out.push({ prod: 'Produktion', click: 'Alle Stempel', stamp: 'Ressortstempel' }[k] + ' ' + U.mult(x) + ' für ' + U.fmtTime(arr[1]));
    };
    if (fx.prod) timed('prod', fx.prod, fx.prod[0] >= 1 ? 'Bürgerfreude' : 'Durchhänger');
    if (fx.click) timed('click', fx.click, 'Stempeleifer');
    if (fx.stamp) timed('stamp', fx.stamp, 'Fortbildung');
    if (fx.flow) { S.korb.flow = Math.min(F.flowMax, S.korb.flow + fx.flow); S.korb.lastCorrect = S.gt; }
    if (fx.form) for (let i = 0; i < fx.form; i++) { const r = rollForm(); out.push('Formular: ' + r.form.name); }
    if (fx.schimmel) C.schimmelSoon();
    if (fx.flag) { S.flags[fx.flag] = true; }
  }
  C.answerAnliegen = function (i) {
    const A = S.anliegen;
    if (!A.cur) return null;
    const a = D.ANL[A.cur];
    const opt = a && a.opts[i];
    if (!opt) return null;
    const out = [];
    let res = opt.res || '';
    if (opt.fx.chance) {
      const ch = opt.fx.chance;
      const won = U.rand() < ch.p;
      const br = won ? ch.win : ch.lose;
      res = br.res;
      applyAnlFx(br, out);
    } else applyAnlFx(opt.fx, out);
    A.cur = null;
    A.recent.push(a.id);
    if (A.recent.length > 8) A.recent.shift();
    S.stats.anliegen++;
    scheduleAnliegen();
    const r = { id: a.id, res, gains: out };
    U.emit('anliegenDone', r);
    return r;
  };

  /* ---------- Großprojekte ---------- */
  C.projState = function (id) {
    const p = D.PROJ[id];
    const st = S.projects[id] || { stage: 0, delays: 0, done: false };
    return { p, stage: st.stage, delays: st.delays || 0, done: !!st.done };
  };
  C.projVisible = (id) => (S.era >= D.PROJ[id].era || !!(S.projects[id] && S.projects[id].done)) && !(D.PROJ[id].finale && S.finale.done);
  C.portalReady = function () {
    const reasons = [];
    if (S.era < 9) reasons.push('Epoche „Das Weltamt“ erreichen');
    const distinct = Object.keys(S.visited).length;
    if (distinct < 5) reasons.push('mindestens 5 verschiedene Leitbilder erleben (bisher ' + distinct + ')');
    return { ok: reasons.length === 0, reasons };
  };
  C.projCost = function (id) {
    const st = C.projState(id);
    if (st.done) return Infinity;
    const p = st.p;
    let c = p.stages[Math.min(st.stage, p.stages.length - 1)].cost;
    if (p.delays && st.stage === p.stages.length - 1) c *= Math.pow(p.delayX, st.delays);
    return c * M.F.projCost;
  };
  C.projStageName = function (id) {
    const st = C.projState(id);
    if (st.done) return 'Abgeschlossen';
    const p = st.p;
    if (p.delays && st.stage === p.stages.length - 1 && st.delays > 0) return p.delayNames[st.delays - 1] + ', dann Eröffnung';
    return p.stages[st.stage].name;
  };
  C.fundProject = function (id) {
    const p = D.PROJ[id];
    if (!p || !C.projVisible(id)) return null;
    if (p.finale && (S.finale.done || !C.portalReady().ok)) return null;
    const st = S.projects[id] = S.projects[id] || { stage: 0, delays: 0, done: false };
    if (st.done) return null;
    const cost = C.projCost(id);
    if (cost > S.akten * (1 + 1e-12)) return null;
    S.akten = Math.max(0, S.akten - cost);
    const last = st.stage === p.stages.length - 1;
    if (last && p.delays && st.delays < p.delays) {
      st.delays++;
      const r = { id, delayed: true, reason: p.delayNames[st.delays - 1], delays: st.delays };
      U.emit('projDelay', r);
      return r;
    }
    if (!last) { st.stage++; U.emit('projStage', { id, stage: st.stage }); return { id, stage: st.stage }; }
    st.done = true;
    if (id === 'flughafen') { const f = D.FORMS.find((x) => x.special === 'flughafen'); if (f) giveForm(f.id); }
    C.recalc();
    if (p.finale) { S.finale.done = true; S.finale.at = C.now(); C.recalc(); U.emit('finale', {}); }
    U.emit('projDone', { id });
    return { id, done: true };
  };

  /* ---------- Reform (Prestige) ---------- */
  C.djTotalFor = (total) => Math.floor(Math.pow(Math.max(0, total) / DJ_DIV, 1 / 3) * M.F.djGain + 1e-9);
  C.djGain = () => Math.max(0, C.djTotalFor(S.totalAkten) - S.dj);
  C.nextDjAt = function () {
    const target = S.dj + C.djGain() + 1;
    return Math.pow(target / M.F.djGain, 3) * DJ_DIV;
  };
  C.leitbildUnlocked = (id) => !!(D.LB[id] && D.LB[id].unlock(S));
  C.reform = function (lbId) {
    const gain = C.djGain();
    if (gain < 1) return null;
    if (!C.leitbildUnlocked(lbId)) return null;
    const F = M.F;
    const firstVisit = !S.visited[lbId];
    S.stats.bestRun = Math.max(S.stats.bestRun, S.runAkten);
    S.dj += gain; S.pp += gain;
    S.stats.reforms++;
    S.streak = lbId === S.leitbild ? Math.min(3, S.streak + 1) : 0;
    S.leitbild = lbId;
    S.visited[lbId] = (S.visited[lbId] || 0) + 1;
    const keepI = F.flags.keepI, keepAll = F.flags.keepAll;
    let paras = {};
    if (keepAll) paras = S.paras;
    else if (keepI) for (const id in S.paras) if (D.PARA[id] && D.PARA[id].teil === 'I') paras[id] = true;
    S.akten = 0; S.runAkten = 0; S.vor = 0; S.runVor = 0; S.novelle = 0;
    S.gens = {}; S.grem = {}; S.ups = {}; S.paras = paras;
    S.era = 0;
    S.korb = { doc: null, pending: [], flow: 0, lastCorrect: -99, lastManual: -99, docNo: S.korb.docNo, autoAcc: 0, wrongStreak: 0 };
    S.buffs = []; S.projects = {};
    S.anliegen.cur = null;
    S.run = { start: C.now(), gt: 0, clicks: 0, correct: 0, docs: 0, schimmel: 0 };
    S.flags.chaosX = 1;
    C.recalc();
    applyStartPerks();
    C.recalc();
    newDoc();
    const r = { gain, lb: lbId, firstVisit };
    U.emit('reform', r);
    return r;
  };
  function applyStartPerks() {
    const F = M.F;
    if (F.flags.startEra) {
      S.era = Math.max(S.era, 2);
      for (const g of D.GENS) if (g.era <= 1) S.gens[g.id] = Math.max(S.gens[g.id] || 0, 10);
    }
    if (F.flags.startgeld) earnStart(S.stats.maxSpsBase * 300);
  }
  function earnStart(x) { if (x > 0 && isFinite(x)) { S.akten += x; } }

  /* ---------- Laufbahn ---------- */
  C.perkState = function (p) {
    if (S.perks[p.id]) return 'owned';
    if (p.req && !S.perks[p.req]) return 'locked';
    const idx = D.LAUFBAHNEN.findIndex((l) => l.id === p.lb);
    if (idx > 0) {
      const prevLb = D.LAUFBAHNEN[idx - 1].id;
      const ownedPrev = D.PERKS.filter((x) => x.lb === prevLb && S.perks[x.id]).length;
      if (ownedPrev < 3) return 'locked';
    }
    return 'open';
  };
  C.buyPerk = function (id) {
    const p = D.PERK[id];
    if (!p || C.perkState(p) !== 'open' || S.pp < p.cost) return false;
    S.pp -= p.cost;
    S.perks[id] = true;
    C.recalc();
    U.emit('perk', { id });
    return true;
  };
  C.stufeCost = () => Math.round(D.STUFE.base * Math.pow(D.STUFE.growth, S.stufe));
  C.buyStufe = function () {
    const c = C.stufeCost();
    if (S.pp < c) return false;
    S.pp -= c; S.stufe++;
    C.recalc();
    U.emit('perk', { id: 'stufe' });
    return true;
  };

  /* ---------- Urkunden ---------- */
  function checkAchievements() {
    let any = false;
    for (const a of D.ACH) {
      if (S.ach[a.id]) continue;
      let ok = false;
      try { ok = a.check(S, C); } catch (e) { ok = false; }
      if (ok) { S.ach[a.id] = C.now(); any = true; U.emit('ach', a); }
    }
    if (any) C.recalc();
  }
  C.checkAchievements = checkAchievements;
  C.mascotClick = function () { S.flags.wieher = (S.flags.wieher || 0) + 1; return U.pick(D.QUIPS); };

  /* ---------- Automatik ---------- */
  function autoBuy() {
    const F = M.F;
    if (F.flags.autoUp && S.settings.autoUp) C.buyAllUpgrades();
    if (F.flags.autoGen && S.settings.autoGen) {
      for (let k = 0; k < 40; k++) {
        let best = null, bestScore = Infinity;
        const g0 = M.staticG * M.rechts;
        for (const g of D.GENS) {
          if (!C.genUnlocked(g)) continue;
          const c = C.genCost(g.id, 1);
          const gain = M.unit[g.id] * g0;
          const score = c / Math.max(gain, 1e-300);
          if (score < bestScore) { bestScore = score; best = { id: g.id, c }; }
        }
        if (!best || best.c > S.akten) break;
        C.buyGen(best.id, 1);
      }
      for (const g of D.GREMIEN) {
        if (S.era < g.era) continue;
        while (C.gremCost(g.id, 1) <= S.akten * 0.05) { if (!C.buyGrem(g.id, 1)) break; }
      }
    }
  }

  /* ---------- Hauptschleife ---------- */
  let achAcc = 0, slowAcc = 0, chaosAcc = 0;
  function step(dt) {
    S.gt += dt; S.run.gt += dt; S.stats.playTime += dt;
    // Buffs ablaufen lassen
    if (S.buffs.length) {
      const before = S.buffs.length;
      S.buffs = S.buffs.filter((b) => b.end > S.gt);
      if (S.buffs.length !== before) U.emit('buffEnd', {});
    }
    C.dyn();
    earn(M.sps * dt);
    if (M.vps > 0) { const v = M.vps * dt; S.vor += v; S.runVor += v; S.totalVor += v; }
    if (M.spsBase > S.stats.maxSpsBase) S.stats.maxSpsBase = M.spsBase;
    if (M.sps > S.stats.maxSps) S.stats.maxSps = M.sps;

    const K = S.korb;
    if (!K.doc) newDoc();
    // Arbeitsfluss verfällt
    if (K.flow > 0 && S.gt - K.lastCorrect > FLOW_HOLD) K.flow = Math.max(0, K.flow - FLOW_DECAY * M.F.flowDecay * dt);
    // EILT-Frist
    if (K.doc && K.doc.type === 'eilt' && S.gt > K.doc.deadline) {
      S.stats.eiltMissed++;
      U.emit('eiltMissed', K.doc);
      K.doc = null; newDoc();
    }
    // Vertretung
    if (M.F.auto > 0 && S.gt - K.lastManual >= AUTO_IDLE) {
      K.autoAcc += M.F.auto * dt;
      let guard = 0;
      while (K.autoAcc >= 1 && guard++ < 20) {
        K.autoAcc -= 1;
        const d = K.doc || newDoc();
        if (d.r < 0) C.eingang(true); else C.ressort(d.r, true);
      }
      if (K.autoAcc > 5) K.autoAcc = 0;
    } else K.autoAcc = 0;

    // Epoche
    const e = Math.max(S.era, eraFor(S.runAkten));
    if (e > S.era) {
      const old = S.era;
      S.era = e;
      if (e > S.maxEra) { S.maxEra = e; S.stats.eraTimes[e] = S.stats.eraTimes[e] || Math.round(S.stats.playTime); }
      C.recalc();
      // Eine Akte ohne Ressort bekommt nach der Einführung von Zuständigkeiten eine Nachfolgerin
      if (K.doc && K.doc.r < 0 && M.ressorts.length) { K.doc = null; newDoc(); }
      U.emit('era', { era: e, old });
    }

    if (C.visible) {
      // Amtsschimmel
      const sc = S.schimmel;
      if (sc.active) {
        if (S.gt > sc.until) { sc.active = false; S.stats.schimmelMissed++; scheduleSchimmel(); U.emit('schimmelGone', {}); }
      } else {
        sc.in -= dt;
        if (sc.in <= 0) {
          sc.active = true; sc.born = S.gt; sc.until = S.gt + SCHIMMEL_LIFE + M.F.schimLife;
          U.emit('schimmelSpawn', { life: sc.until - S.gt });
        }
      }
      // Bürgeranliegen
      const A = S.anliegen;
      if (A.cur) {
        if (S.gt > A.until) { A.recent.push(A.cur); if (A.recent.length > 8) A.recent.shift(); A.cur = null; scheduleAnliegen(); U.emit('anliegenGone', {}); }
      } else if (S.era >= 0 && S.gt > 60) {
        A.in -= dt;
        if (A.in <= 0) {
          const a = pickAnliegen();
          if (a) { A.cur = a.id; A.until = S.gt + ANL_WAIT; U.emit('anliegen', a); } else scheduleAnliegen();
        }
      }
    }
    // Schilda
    if (M.F.chaos) {
      chaosAcc += dt;
      if (chaosAcc >= 60 || !S.flags.chaosX) { chaosAcc = 0; S.flags.chaosX = U.pick(CHAOS); U.emit('chaos', { x: S.flags.chaosX }); }
    }
    if (S.runAkten >= 1e6 && S.run.clicks === 0 && S.run.correct === 0 && S.stats.reforms > 0) S.flags.reinverwaltung = true;

    slowAcc += dt;
    if (slowAcc >= 1) { slowAcc = 0; autoBuy(); }
    achAcc += dt;
    if (achAcc >= 1) { achAcc = 0; checkAchievements(); }
  }
  C.tick = function (dt) {
    if (!S || !(dt > 0)) return;
    while (dt > 1e-9) {
      const d = Math.min(dt, 1);
      step(d);
      dt -= d;
    }
  };

  /* ---------- Offline ---------- */
  C.offlineEff = () => Math.min(1, M.F.offEff);
  C.offlineCapH = () => M.F.offCap;
  C.applyOffline = function (sec, effOverride) {
    if (!(sec > 0)) return null;
    const eff = effOverride || C.offlineEff();
    const t = Math.min(sec, C.offlineCapH() * 3600);
    S.buffs = [];
    const oldEra = S.era;
    const chaosBefore = S.flags.chaosX;
    if (M.F.chaos) S.flags.chaosX = CHAOS.reduce((a, b) => a + b, 0) / CHAOS.length;
    // In Schritten: Vorschriften wachsen (Parkinson), die Automatik kauft ein, die Vertretung stempelt mit
    const steps = Math.max(1, Math.min(240, Math.ceil(t / 30))), h = t / steps;
    let gain = 0, vGain = 0;
    for (let i = 0; i < steps; i++) {
      C.dyn();
      let g = M.spsBase * h * eff;
      if (M.F.auto > 0) g += M.F.auto * h * M.autoVal * eff;
      earn(g); gain += g;
      if (M.vps > 0) { const v = M.vps * h * eff; S.vor += v; S.runVor += v; S.totalVor += v; vGain += v; }
      const e = Math.max(S.era, eraFor(S.runAkten));
      if (e > S.era) { S.era = e; if (e > S.maxEra) { S.maxEra = e; S.stats.eraTimes[e] = S.stats.eraTimes[e] || Math.round(S.stats.playTime); } C.recalc(); }
      autoBuy();
    }
    S.stats.offlineAkten += gain;
    if (M.F.chaos) S.flags.chaosX = chaosBefore || 1;
    C.recalc();
    checkAchievements();
    if (S.era > oldEra) U.emit('era', { era: S.era, old: oldEra, offline: true });
    const r = { sec, t, gain, vGain, eff, capped: sec > t };
    U.emit('offline', r);
    return r;
  };

  /* ---------- Speichern & Laden ---------- */
  const MAPS = {
    gens: ['num', D.GEN, true], grem: ['num', D.GREM, true], ups: ['true', D.UP], paras: ['true', D.PARA], perks: ['true', D.PERK],
    forms: ['num', D.FORM, true], ach: ['num', D.ACHS], visited: ['num', D.LB], projects: ['obj', D.PROJ],
    flags: ['any', null], tips: ['any', null], 'stats.eraTimes': ['num', null],
  };
  function cleanMap(src, spec) {
    const [type, known] = spec;
    const out = {};
    for (const k in src) {
      if (known && !known[k]) continue;
      const v = src[k];
      if (type === 'num') { if (typeof v === 'number' && isFinite(v) && v >= 0 && !(spec[2] && v < 1)) out[k] = spec[2] ? Math.floor(v) : v; }
      else if (type === 'true') { if (v === true) out[k] = true; }
      else if (type === 'obj') {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          const p = known[k];
          out[k] = { stage: U.clamp(Math.floor(+v.stage || 0), 0, p.stages.length - 1), delays: U.clamp(Math.floor(+v.delays || 0), 0, p.delays || 0), done: !!v.done };
        }
      }
      else if (type === 'any') { if (['number', 'string', 'boolean'].indexOf(typeof v) >= 0 && (typeof v !== 'number' || isFinite(v))) out[k] = v; }
    }
    return out;
  }
  function sanitize(def, src, path) {
    if (MAPS[path]) return src && typeof src === 'object' && !Array.isArray(src) ? cleanMap(src, MAPS[path]) : def;
    if (def === null) return src && (typeof src === 'object' || typeof src === 'string') ? src : null;
    if (src === undefined || src === null) return def;
    if (Array.isArray(def)) return Array.isArray(src) ? src : def;
    if (typeof def === 'number') return typeof src === 'number' && isFinite(src) ? Math.max(0, src) : def;
    if (typeof def === 'boolean') return typeof src === 'boolean' ? src : def;
    if (typeof def === 'string') return typeof src === 'string' ? src : def;
    if (typeof def === 'object') {
      if (typeof src !== 'object' || Array.isArray(src)) return def;
      const out = {};
      for (const k in def) out[k] = sanitize(def[k], src[k], path ? path + '.' + k : k);
      return out;
    }
    return def;
  }
  // Migrationen: MIGRATIONS[n] hebt einen Spielstand von Version n auf n + 1
  C.MIGRATIONS = {
    0: (s) => { // Vorabversion: Vorschriften hießen „paragraphs“, Leitbild fehlte
      if (s.paragraphs !== undefined && s.vor === undefined) s.vor = s.paragraphs;
      if (!s.leitbild) s.leitbild = 'kameral';
      return s;
    },
  };
  C.migrate = function (s) {
    let v = typeof s.v === 'number' ? s.v : 0;
    while (v < C.VERSION) {
      const fn = C.MIGRATIONS[v];
      if (fn) s = fn(s) || s;
      v++;
      s.v = v;
    }
    return s;
  };
  function validateLoaded(s) {
    // Querbezüge reparieren
    if (!D.LB[s.leitbild]) s.leitbild = 'kameral';
    if (!s.visited[s.leitbild]) s.visited[s.leitbild] = 1;
    s.era = Math.min(D.ERAS.length - 1, Math.floor(s.era));
    s.maxEra = Math.max(s.era, Math.min(D.ERAS.length - 1, Math.floor(s.maxEra)));
    s.streak = Math.min(3, Math.floor(s.streak));
    s.buffs = s.buffs.filter((b) => b && typeof b.end === 'number' && typeof b.x === 'number' && isFinite(b.x) && ['prod', 'click', 'stamp', 'cost', 'gen'].indexOf(b.k) >= 0);
    const K = s.korb;
    if (!Array.isArray(K.pending)) K.pending = [];
    K.pending = K.pending.filter((p) => p && Number.isInteger(p.r) && p.r >= 0 && p.r < D.RESSORTS.length && typeof p.title === 'string' &&
      typeof p.due === 'number' && isFinite(p.due) && p.need === 2 && typeof p.prog === 'number').slice(0, 8);
    for (const p of K.pending) p.due = Math.min(p.due, K.docNo + 3);
    const okSeq = (q) => q === undefined || (Array.isArray(q) && q.length === 3 && q.every((x) => Number.isInteger(x) && x >= 0 && x < D.RESSORTS.length));
    const okDoc = (d) => d && Number.isInteger(d.r) && d.r >= -1 && d.r < D.RESSORTS.length && typeof d.need === 'number' && d.need >= 1 && d.need <= 3 && typeof d.prog === 'number' && typeof d.title === 'string' && okSeq(d.seq);
    if (!okDoc(K.doc)) K.doc = null;
    if (typeof s.anliegen.cur !== 'string') s.anliegen.cur = null;
    if (s.anliegen.cur && !D.ANL[s.anliegen.cur]) s.anliegen.cur = null;
    if (!Array.isArray(s.anliegen.recent)) s.anliegen.recent = [];
    if (['kurz', 'lang', 'wiss'].indexOf(s.settings.numFmt) < 0) s.settings.numFmt = 'kurz';
    s.settings.buyAmt = String(s.settings.buyAmt);
    if (['1', '10', '100', 'max'].indexOf(s.settings.buyAmt) < 0) s.settings.buyAmt = '1';
    s.settings.sfxVol = U.clamp(s.settings.sfxVol, 0, 1);
    s.settings.musicVol = U.clamp(s.settings.musicVol, 0, 1);
    if (['auto', 'voll', 'wenig'].indexOf(s.settings.motion) < 0) s.settings.motion = 'auto';
    if (s.lastSave > C.now()) s.lastSave = C.now(); // Uhr wurde zurückgestellt
    s.novelle = Math.floor(s.novelle);
    return s;
  }
  C.fromObject = function (obj) {
    if (!obj || typeof obj !== 'object') throw new Error('Kein Spielstand');
    if (typeof obj.v === 'number' && obj.v > C.VERSION) { const e = new Error('Spielstand stammt aus einer neueren Version'); e.future = true; throw e; }
    const m = C.migrate(obj);
    return validateLoaded(sanitize(newState(), m, ''));
  };
  C.serialize = function () {
    S.lastSave = C.now();
    S.settings.numFmt = U.numFmt;
    return JSON.stringify(S);
  };
  C.readOnly = false; // gesetzt, wenn ein neuerer Spielstand liegt oder ein anderer Tab spielt
  C.onUnlock = null;  // Hook für den Browser (Tab-Sperre übernehmen)
  C.unlockSave = function () { C.readOnly = false; C.futureLock = false; if (C.onUnlock) C.onUnlock(); };
  C.save = function () {
    if (!C.storage || !S || C.readOnly) return false;
    try {
      const str = C.serialize();
      C.storage.set(C.SAVE_KEY, str);
      if (S.gt - S.lastBackup >= 600 || !S.lastBackup) {
        S.lastBackup = S.gt;
        let list = [];
        try { list = JSON.parse(C.storage.get(C.BACKUP_KEY) || '[]'); } catch (e) { list = []; }
        const key = 'amtsschimmel.backup.' + (list.length ? (list[list.length - 1].n + 1) % 3 : 0);
        C.storage.set(key, str);
        list = list.filter((b) => b.key !== key);
        list.push({ key, n: +key.slice(-1), t: C.now(), total: S.totalAkten });
        C.storage.set(C.BACKUP_KEY, JSON.stringify(list.slice(-3)));
      }
      return true;
    } catch (e) {
      U.emit('saveError', { error: String(e && e.message || e) });
      return false;
    }
  };
  C.listBackups = function () {
    if (!C.storage) return [];
    try { return JSON.parse(C.storage.get(C.BACKUP_KEY) || '[]').filter((b) => C.storage.get(b.key)).sort((a, b) => b.t - a.t); } catch (e) { return []; }
  };
  /** Lädt den Spielstand. Liefert { fresh, offline, problem } */
  C.load = function () {
    const info = { fresh: true, offline: null, problem: null };
    let raw = null;
    if (C.storage) { try { raw = C.storage.get(C.SAVE_KEY); } catch (e) { raw = null; } }
    if (raw) {
      try {
        S = C.fromObject(JSON.parse(raw));
        info.fresh = false;
      } catch (e) {
        const stamp = C.now();
        try { C.storage.set((e.future ? 'amtsschimmel.future.' : 'amtsschimmel.corrupt.') + stamp, raw); } catch (e2) { /* Speicher voll */ }
        info.problem = e.future ? 'future' : 'corrupt';
        if (e.future) { C.readOnly = true; C.futureLock = true; } // einen neueren Spielstand niemals überschreiben
        // jüngstes lesbares Backup versuchen
        for (const b of C.listBackups()) {
          try { S = C.fromObject(JSON.parse(C.storage.get(b.key))); info.restored = b; info.fresh = false; break; } catch (e3) { /* nächstes */ }
        }
      }
    }
    if (!S) S = newState();
    U.numFmt = S.settings.numFmt;
    C.recalc();
    if (!info.fresh) {
      const away = (C.now() - S.lastSave) / 1000;
      if (away > 60) info.offline = C.applyOffline(away);
    }
    if (!S.korb.doc) newDoc();
    if (!S.schimmel.active && S.schimmel.in <= 0) scheduleSchimmel();
    S.schimmel.active = false;
    return info;
  };
  C.init = function (state) {
    S = state ? C.fromObject(state) : newState();
    U.numFmt = S.settings.numFmt;
    C.recalc();
    if (!S.korb.doc) newDoc();
    return S;
  };
  C.exportStr = function () {
    const json = C.serialize();
    return 'AMT1:' + U.toB64(json) + '.' + U.hash(json);
  };
  C.importStr = function (str) {
    str = String(str || '').trim();
    const m = /^AMT1:([A-Za-z0-9+/=]+)\.([0-9a-z]+)$/.exec(str);
    if (!m) return { ok: false, error: 'Das ist kein Amtsschimmel-Spielstand (er muss mit „AMT1:“ beginnen).' };
    let json;
    try { json = U.fromB64(m[1]); } catch (e) { return { ok: false, error: 'Der Spielstand ist beschädigt (Kodierung).' }; }
    if (U.hash(json) !== m[2]) return { ok: false, error: 'Die Prüfsumme stimmt nicht – der Text wurde wohl unvollständig kopiert.' };
    let obj;
    try { obj = JSON.parse(json); } catch (e) { return { ok: false, error: 'Der Spielstand ist beschädigt (Format).' }; }
    if (!obj || typeof obj.totalAkten !== 'number' || typeof obj.gens !== 'object') return { ok: false, error: 'Der Spielstand ist unvollständig.' };
    let st;
    try { st = C.fromObject(obj); } catch (e) { return { ok: false, error: e.future ? 'Dieser Spielstand stammt aus einer neueren Version des Spiels.' : 'Der Spielstand ist ungültig.' }; }
    if (C.storage) { try { C.storage.set('amtsschimmel.beforeImport', C.serialize()); } catch (e) { /* egal */ } }
    S = st;
    U.numFmt = S.settings.numFmt;
    C.recalc();
    if (!S.korb.doc) newDoc();
    C.unlockSave();
    C.save();
    U.emit('loaded', {});
    return { ok: true };
  };
  C.restoreBackup = function (key) {
    if (!C.storage) return false;
    try {
      S = C.fromObject(JSON.parse(C.storage.get(key)));
      U.numFmt = S.settings.numFmt;
      C.recalc();
      if (!S.korb.doc) newDoc();
      C.unlockSave();
      C.save();
      U.emit('loaded', {});
      return true;
    } catch (e) { return false; }
  };
  C.hardReset = function () {
    const settings = S ? S.settings : null;
    S = newState();
    if (settings) S.settings = settings;
    C.recalc();
    newDoc();
    C.unlockSave();
    C.save();
    U.emit('loaded', {});
  };
})(typeof window !== 'undefined' ? window : globalThis);

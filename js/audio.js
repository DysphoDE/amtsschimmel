'use strict';
/* Amtsschimmel – Klang. Alles wird live per WebAudio erzeugt, es gibt keine Audiodateien.
   Musik: generative „Warteschleifenmusik“, deren Instrumente sich mit der Epoche ändern. */
(function (root) {
  const AS = (root.AS = root.AS || {});
  const A = (AS.Audio = {});
  let ctx = null, master = null, sfxBus = null, musicBus = null, comp = null, noiseBuf = null;
  let enabled = true, musicOn = true, sfxVol = 0.7, musicVol = 0.4, era = 0;
  let lastPlay = {};

  function ensure() {
    if (ctx) return ctx;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.9;
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxVol;
    musicBus = ctx.createGain(); musicBus.gain.value = musicVol * 0.55;
    sfxBus.connect(comp); musicBus.connect(comp); comp.connect(master); master.connect(ctx.destination);
    const len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  A.unlock = function () {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume();
    if (c && musicOn && enabled) startMusic();
  };
  A.setEnabled = (on) => { enabled = on; if (!on) stopMusic(); else if (musicOn && ctx) startMusic(); };
  A.setMusic = (on) => { musicOn = on; if (!on) stopMusic(); else if (enabled && ctx) startMusic(); };
  A.setVolumes = (s, m) => {
    sfxVol = s; musicVol = m;
    if (sfxBus) sfxBus.gain.value = s;
    if (musicBus) musicBus.gain.value = m * 0.55;
  };
  A.setEra = (e) => { era = e; };
  const ok = (name, gap) => {
    if (!enabled || !ctx || ctx.state !== 'running') return false;
    const t = ctx.currentTime;
    if (gap && lastPlay[name] && t - lastPlay[name] < gap) return false;
    lastPlay[name] = t;
    return true;
  };

  /* ---------- Bausteine ---------- */
  function env(g, t, a, peak, dec, sus, rel) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t + a + dec);
    if (rel) g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec + rel);
  }
  function tone(freq, t, dur, type, vol, dest, opts) {
    opts = opts || {};
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + dur);
    if (opts.detune) o.detune.value = opts.detune;
    let node = o;
    if (opts.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.lp; f.Q.value = opts.q || 0.7; o.connect(f); node = f; }
    node.connect(g); g.connect(dest || sfxBus);
    env(g, t, opts.a || 0.005, vol, opts.d || dur * 0.4, opts.s === undefined ? vol * 0.3 : opts.s, opts.r || dur * 0.6);
    o.start(t); o.stop(t + dur + (opts.r || dur) + 0.05);
    return o;
  }
  function noise(t, dur, vol, type, freq, q, dest) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type || 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
    const g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(dest || sfxBus);
    env(g, t, 0.003, vol, dur * 0.3, vol * 0.2, dur * 0.7);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.1);
    return f;
  }

  /* ---------- Soundeffekte ---------- */
  A.stamp = function (kind, flow) {
    if (!ok('stamp', 0.025)) return;
    const t = ctx.currentTime;
    const heavy = kind !== 'eingang' && kind !== 'auto';
    if (era >= 7) {
      // Digitaler Stempel: Klick und Bestätigungston
      tone(heavy ? 880 : 1320, t, 0.05, 'sine', heavy ? 0.22 : 0.14, sfxBus, { d: 0.02, s: 0.02, r: 0.03 });
      tone(heavy ? 1760 : 2640, t + 0.04, 0.05, 'sine', heavy ? 0.12 : 0.07, sfxBus, { d: 0.02, s: 0.01, r: 0.03 });
      noise(t, 0.015, 0.1, 'highpass', 6000, 0.7);
    } else if (era === 0) {
      // Griffel in feuchten Ton: dumpf
      tone(heavy ? 110 : 150, t, 0.14, 'sine', heavy ? 0.8 : 0.5, sfxBus, { slide: 40, d: 0.06, s: 0.04, r: 0.08 });
      noise(t, 0.08, heavy ? 0.35 : 0.22, 'lowpass', 500, 0.8);
    } else {
      // Holz-Rumms (ab der Kaiserzeit mit metallischem Anschlag)
      tone(heavy ? 140 : 190, t, 0.12, 'sine', heavy ? 0.9 : 0.55, sfxBus, { slide: heavy ? 45 : 70, d: 0.05, s: 0.05, r: 0.08 });
      noise(t, 0.05, heavy ? 0.5 : 0.3, 'lowpass', 900, 0.7);
      noise(t + 0.004, 0.025, heavy ? 0.25 : 0.18, 'bandpass', era >= 4 ? 4200 : 3200, era >= 4 ? 6 : 2);
    }
    if (kind === 'correct') {
      const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
      const n = scale[Math.min(scale.length - 1, Math.floor((flow || 0) / 4))];
      tone(523.25 * Math.pow(2, n / 12), t + 0.03, 0.18, 'triangle', 0.16, sfxBus, { a: 0.004, d: 0.06, s: 0.03 });
      noise(t + 0.06, 0.18, 0.12, 'bandpass', 2400, 0.8); // Papier rascheln
    }
    if (kind === 'auto') tone(330, t + 0.02, 0.08, 'triangle', 0.06);
  };
  A.wrong = function () {
    if (!ok('wrong', 0.1)) return;
    const t = ctx.currentTime;
    tone(196, t, 0.16, 'square', 0.12, sfxBus, { lp: 900 });
    tone(147, t + 0.13, 0.26, 'square', 0.12, sfxBus, { lp: 700 });
  };
  A.docDone = function (special) {
    if (!ok('doc', 0.05)) return;
    const t = ctx.currentTime;
    const f = noise(t, 0.22, 0.14, 'bandpass', 1500, 0.9);
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(3500, t + 0.2);
    if (special) [0, 4, 7, 12].forEach((s, i) => tone(659.25 * Math.pow(2, s / 12), t + i * 0.06, 0.2, 'triangle', 0.12));
  };
  A.bell = function () { // Schreibmaschinenglocke bei Fluss-Meilensteinen
    if (!ok('bell', 0.2)) return;
    const t = ctx.currentTime;
    tone(2093, t, 0.6, 'sine', 0.18, sfxBus, { d: 0.05, s: 0.06, r: 0.5 });
    tone(2637, t, 0.4, 'sine', 0.07, sfxBus, { d: 0.03, s: 0.02, r: 0.3 });
  };
  A.buy = function () {
    if (!ok('buy', 0.04)) return;
    const t = ctx.currentTime;
    tone(880, t, 0.06, 'triangle', 0.13);
    tone(1318.5, t + 0.05, 0.1, 'triangle', 0.11);
  };
  A.upgrade = function () {
    if (!ok('up', 0.08)) return;
    const t = ctx.currentTime;
    [0, 4, 7].forEach((s, i) => tone(523.25 * Math.pow(2, s / 12), t + i * 0.05, 0.16, 'square', 0.06, sfxBus, { lp: 2400 }));
  };
  A.para = function () {
    if (!ok('para', 0.1)) return;
    const t = ctx.currentTime;
    tone(110, t, 0.18, 'sine', 0.7, sfxBus, { slide: 50, d: 0.06, s: 0.05 });
    noise(t, 0.08, 0.4, 'lowpass', 700);
    [0, 7, 12].forEach((s, i) => tone(392 * Math.pow(2, s / 12), t + 0.08 + i * 0.07, 0.3, 'sine', 0.12));
  };
  A.eilt = function () { // Telefonklingeln
    if (!ok('eilt', 1)) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      tone(i % 2 ? 480 : 440, t + i * 0.05, 0.05, 'square', 0.05, sfxBus, { lp: 2000, a: 0.002, s: 0.04, r: 0.01 });
    }
  };
  A.schimmel = function () { // Galopp + Wiehern
    if (!ok('schimmel', 1)) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const tt = t + i * 0.16;
      tone(90, tt, 0.06, 'sine', 0.5, sfxBus, { slide: 50 });
      tone(110, tt + 0.05, 0.05, 'sine', 0.35, sfxBus, { slide: 60 });
      noise(tt, 0.04, 0.15, 'lowpass', 600);
    }
    neigh(t + 0.25);
  };
  function neigh(t) {
    const o = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sawtooth'; m.type = 'sine';
    o.frequency.setValueAtTime(700, t);
    o.frequency.linearRampToValueAtTime(1050, t + 0.15);
    o.frequency.linearRampToValueAtTime(820, t + 0.5);
    o.frequency.linearRampToValueAtTime(520, t + 0.9);
    m.frequency.value = 18; mg.gain.value = 45;
    m.connect(mg); mg.connect(o.frequency);
    f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.6;
    o.connect(f); f.connect(g); g.connect(sfxBus);
    env(g, t, 0.05, 0.12, 0.3, 0.08, 0.5);
    o.start(t); m.start(t); o.stop(t + 1); m.stop(t + 1);
  }
  A.neigh = function () { if (ok('neigh', 0.6)) neigh(ctx.currentTime); };
  A.catchSchimmel = function () {
    if (!ok('catch', 0.2)) return;
    const t = ctx.currentTime;
    [0, 4, 7, 12, 16].forEach((s, i) => tone(523.25 * Math.pow(2, s / 12), t + i * 0.06, 0.25, 'triangle', 0.14));
    neigh(t + 0.1);
  };
  A.anliegen = function () { // Türglocke am Schalter
    if (!ok('anl', 1)) return;
    const t = ctx.currentTime;
    tone(1318.5, t, 0.5, 'sine', 0.16, sfxBus, { d: 0.05, s: 0.05, r: 0.4 });
    tone(1046.5, t + 0.25, 0.7, 'sine', 0.16, sfxBus, { d: 0.05, s: 0.05, r: 0.6 });
  };
  A.form = function (rarity) {
    if (!ok('form', 0.2)) return;
    const t = ctx.currentTime;
    const steps = { g: [0, 7], s: [0, 4, 7], a: [0, 4, 7, 11], l: [0, 4, 7, 12, 16, 19] }[rarity] || [0, 7];
    noise(t, 0.2, 0.12, 'bandpass', 2600, 0.8);
    steps.forEach((s, i) => tone(784 * Math.pow(2, s / 12), t + 0.05 + i * 0.07, 0.3, 'sine', 0.12));
  };
  A.ach = function () {
    if (!ok('ach', 0.3)) return;
    const t = ctx.currentTime;
    [0, 7, 12].forEach((s, i) => tone(587.33 * Math.pow(2, s / 12), t + i * 0.09, 0.35, 'triangle', 0.12));
  };
  A.fanfare = function () {
    if (!ok('fan', 0.5)) return;
    const t = ctx.currentTime;
    const notes = [[0, 0.15], [5, 0.15], [9, 0.15], [12, 0.5]];
    let tt = t;
    for (const [s, d] of notes) {
      tone(349.23 * Math.pow(2, s / 12), tt, d, 'sawtooth', 0.09, sfxBus, { lp: 1800, a: 0.02, s: 0.06 });
      tone(349.23 * Math.pow(2, s / 12) / 2, tt, d, 'triangle', 0.08);
      tt += d * 0.9;
    }
  };
  A.reform = function () {
    if (!ok('reform', 0.5)) return;
    const t = ctx.currentTime;
    const f = noise(t, 1.2, 0.3, 'lowpass', 300, 0.5);
    f.frequency.exponentialRampToValueAtTime(6000, t + 1.1);
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(261.63 * Math.pow(2, s / 12), t + 0.5 + i * 0.08, 0.6, 'triangle', 0.12));
  };
  A.fax = function () {
    if (!ok('fax', 3)) return;
    const t = ctx.currentTime;
    tone(1100, t, 0.25, 'sine', 0.06, sfxBus, { s: 0.05 });
    tone(2100, t + 0.3, 0.35, 'sine', 0.05, sfxBus, { s: 0.04 });
    noise(t + 0.7, 0.4, 0.05, 'bandpass', 1800, 3);
  };
  A.printer = function () {
    if (!ok('printer', 0.5)) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 18; i++) noise(t + i * 0.045, 0.03, 0.16, 'bandpass', 2200 + (i % 3) * 400, 4);
  };
  A.click = function () { if (ok('ui', 0.03)) tone(1200, ctx.currentTime, 0.03, 'triangle', 0.06, sfxBus, { s: 0.01 }); };

  /* ---------- Musik: Warteschleife ---------- */
  // Stile je Epochengruppe
  const STYLES = [
    { name: 'antik', bpm: 76, prog: [[0, 7], [5, 12], [3, 10], [0, 7]], scale: [0, 2, 3, 5, 7, 9, 10], root: 50, lead: 'pluck', pad: 'drone', drums: 'hand' },
    { name: 'kanzlei', bpm: 84, prog: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], scale: [0, 2, 4, 5, 7, 9, 11], root: 55, lead: 'harpsi', pad: 'organ', drums: 'none' },
    { name: 'kaiser', bpm: 96, prog: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], scale: [0, 2, 4, 5, 7, 9, 11], root: 53, lead: 'box', pad: 'none', drums: 'waltz', meter: 3 },
    { name: 'muzak', bpm: 92, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]], scale: [0, 2, 4, 7, 9], root: 53, lead: 'epiano', pad: 'epiano', drums: 'bossa' },
    { name: 'zukunft', bpm: 100, prog: [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [7, 10, 14, 17]], scale: [0, 3, 5, 7, 10], root: 50, lead: 'arp', pad: 'pad', drums: 'soft' },
  ];
  const styleFor = (e) => (e <= 1 ? 0 : e <= 2 ? 1 : e <= 4 ? 2 : e <= 7 ? 3 : 4);
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let musicTimer = null, nextT = 0, step16 = 0, bar = 0, melodyPos = 0;

  function startMusic() {
    if (!ctx || musicTimer) return;
    nextT = ctx.currentTime + 0.1; step16 = 0; bar = 0;
    musicTimer = setInterval(schedule, 90);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

  function schedule() {
    if (!ctx || ctx.state !== 'running') return;
    const st = STYLES[styleFor(era)];
    const meter = st.meter || 4;
    const stepDur = 60 / st.bpm / 4;
    const stepsPerBar = meter * 4;
    while (nextT < ctx.currentTime + 0.25) {
      playStep(st, step16, nextT, stepDur, stepsPerBar);
      nextT += stepDur;
      step16++;
      if (step16 >= stepsPerBar) { step16 = 0; bar++; }
    }
  }
  function voice(kind, midi, t, dur, vol) {
    const f = mtof(midi);
    const d = musicBus;
    switch (kind) {
      case 'pluck': tone(f, t, dur, 'triangle', vol, d, { a: 0.003, d: 0.12, s: vol * 0.05, r: 0.3, lp: 2200 }); break;
      case 'harpsi': tone(f, t, dur, 'sawtooth', vol * 0.5, d, { a: 0.002, d: 0.1, s: vol * 0.05, r: 0.25, lp: 3000 }); break;
      case 'box': tone(f * 2, t, dur, 'sine', vol, d, { a: 0.002, d: 0.2, s: vol * 0.04, r: 0.5 }); tone(f * 4, t, dur, 'sine', vol * 0.2, d, { a: 0.002, d: 0.08, s: 0.001, r: 0.2 }); break;
      case 'epiano': {
        // FM-E-Piano
        const o = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
        o.frequency.value = f; m.frequency.value = f * 2; mg.gain.setValueAtTime(f * 1.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.1, t + 0.4);
        m.connect(mg); mg.connect(o.frequency); o.connect(g); g.connect(d);
        env(g, t, 0.006, vol, 0.25, vol * 0.25, dur);
        o.start(t); m.start(t); o.stop(t + dur + 0.5); m.stop(t + dur + 0.5);
        break;
      }
      case 'arp': tone(f, t, dur, 'square', vol * 0.35, d, { a: 0.004, d: 0.08, s: vol * 0.08, r: 0.15, lp: 1800 }); break;
      case 'pad': tone(f, t, dur, 'sawtooth', vol * 0.25, d, { a: 0.4, d: 0.5, s: vol * 0.18, r: 0.8, lp: 900, detune: 7 }); tone(f, t, dur, 'sawtooth', vol * 0.25, d, { a: 0.4, d: 0.5, s: vol * 0.18, r: 0.8, lp: 900, detune: -7 }); break;
      case 'organ': tone(f, t, dur, 'sine', vol * 0.5, d, { a: 0.05, d: 0.2, s: vol * 0.4, r: 0.2 }); tone(f * 2, t, dur, 'sine', vol * 0.25, d, { a: 0.05, d: 0.2, s: vol * 0.2, r: 0.2 }); break;
      case 'drone': tone(f, t, dur, 'triangle', vol * 0.5, d, { a: 0.6, d: 0.6, s: vol * 0.35, r: 1, lp: 600 }); break;
      case 'bass': tone(f, t, dur, 'triangle', vol, d, { a: 0.005, d: 0.15, s: vol * 0.4, r: 0.15, lp: 700 }); break;
      default: break;
    }
  }
  function playStep(st, s, t, stepDur, stepsPerBar) {
    const prog = st.prog[bar % st.prog.length];
    const root = st.root;
    const beat = s % 4 === 0;
    // Akkord / Fläche
    if (s === 0 && st.pad !== 'none') {
      const dur = stepDur * stepsPerBar * 0.95;
      prog.forEach((iv) => voice(st.pad, root + 12 + iv, t, dur, 0.05));
    }
    // Bass
    if (st.name === 'muzak') {
      if (s === 0 || s === 6 || s === 8 || s === 14) voice('bass', root - 12 + (s >= 8 ? prog[0] + 7 : prog[0]), t, stepDur * 2, 0.2);
    } else if (st.name === 'kaiser') {
      if (s === 0) voice('bass', root - 12 + prog[0], t, stepDur * 3, 0.2);
      if (s === 4 || s === 8) prog.slice(1).forEach((iv) => voice('box', root - 12 + iv, t, stepDur * 2, 0.04));
    } else if (beat) voice('bass', root - 12 + prog[0], t, stepDur * 3, st.name === 'zukunft' ? 0.16 : 0.12);
    // Melodie
    const melodyEvery = st.name === 'zukunft' ? 2 : st.name === 'antik' ? 4 : 2;
    if (s % melodyEvery === 0) {
      const play = st.name === 'zukunft' ? true : Math.random() < (beat ? 0.7 : 0.35);
      if (play) {
        let idx;
        if (st.name === 'zukunft') idx = (s / 2 + bar) % 4;
        else { melodyPos += Math.random() < 0.5 ? -1 : 1; melodyPos = Math.max(-2, Math.min(9, melodyPos)); idx = melodyPos; }
        const sc = st.scale;
        const oct = Math.floor(idx / sc.length);
        const note = st.name === 'zukunft' ? root + 12 + prog[idx % prog.length] : root + 12 + sc[((idx % sc.length) + sc.length) % sc.length] + 12 * oct;
        voice(st.lead, note, t, stepDur * melodyEvery * 1.5, st.name === 'zukunft' ? 0.05 : 0.07);
      }
    }
    // Rhythmus
    if (st.drums === 'bossa') {
      if (s % 2 === 0) noise(t, 0.03, 0.025, 'highpass', 7000, 0.7, musicBus);
      if (s === 3 || s === 6 || s === 10 || s === 12) noise(t, 0.04, 0.05, 'bandpass', 1800, 4, musicBus);
    } else if (st.drums === 'waltz') {
      if (s === 0) tone(80, t, 0.15, 'sine', 0.2, musicBus, { slide: 40 });
      if (s === 4 || s === 8) noise(t, 0.05, 0.04, 'highpass', 5000, 0.7, musicBus);
    } else if (st.drums === 'hand') {
      if (s === 0 || s === 10) tone(120, t, 0.12, 'sine', 0.2, musicBus, { slide: 70 });
      if (s === 6 || s === 14) noise(t, 0.05, 0.05, 'bandpass', 900, 2, musicBus);
    } else if (st.drums === 'soft') {
      if (s % 4 === 2) noise(t, 0.03, 0.025, 'highpass', 8000, 0.7, musicBus);
      if (s === 0 || s === 8) tone(60, t, 0.2, 'sine', 0.22, musicBus, { slide: 35 });
    }
  }

  /* ---------- Warteschleifenansage (Sprachausgabe, falls vorhanden) ---------- */
  A.ansage = function () {
    try {
      if (!root.speechSynthesis) return false;
      const u = new root.SpeechSynthesisUtterance('Bitte warten Sie. Der nächste freie Sachbearbeiter ist gleich für Sie da. Ihre Geduld ist uns wichtig.');
      u.lang = 'de-DE'; u.rate = 0.95; u.pitch = 1;
      root.speechSynthesis.cancel();
      root.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  };
})(typeof window !== 'undefined' ? window : globalThis);

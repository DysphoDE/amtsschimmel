'use strict';
/* Amtsschimmel – Hilfsfunktionen: Zahlen (deutsche lange Skala), Zeit, Zufall, Ereignisse.
   Ohne DOM, läuft auch in Node (Simulation, Tests). */
(function (root) {
  const AS = (root.AS = root.AS || {});
  const U = (AS.U = {});

  /* ---------- Zahlen ---------- */
  const SHORT = ['', 'Tsd.', 'Mio.', 'Mrd.', 'Bio.', 'Brd.', 'Trio.', 'Trd.', 'Quadr.', 'Quadrd.', 'Quint.', 'Quintd.',
    'Sext.', 'Sextd.', 'Sept.', 'Septd.', 'Okt.', 'Oktd.', 'Non.', 'Nond.', 'Dez.', 'Dezd.'];
  const LONG = ['', 'Tausend', 'Million', 'Milliarde', 'Billion', 'Billiarde', 'Trillion', 'Trilliarde', 'Quadrillion',
    'Quadrilliarde', 'Quintillion', 'Quintilliarde', 'Sextillion', 'Sextilliarde', 'Septillion', 'Septilliarde',
    'Oktillion', 'Oktilliarde', 'Nonillion', 'Nonilliarde', 'Dezillion', 'Dezilliarde'];
  const plural = (w) => (w === 'Tausend' ? w : w.endsWith('e') ? w + 'n' : w + 'en');

  // 'kurz' = 1,23 Mio. · 'lang' = 1,23 Millionen · 'wiss' = 1,23e6
  U.numFmt = 'kurz';

  // Abschneiden statt Runden, damit nie „1.000 Mio.“ erscheint
  const trunc = (x, d) => { const p = Math.pow(10, d); return Math.floor(x * p + 1e-9) / p; };
  const group = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (x, d) => x.toFixed(d).replace('.', ',');
  // Höchstens 2 Nachkommastellen – „1,234“ sähe im Deutschen aus wie eintausendzweihundertvierunddreißig
  const trimZeros = (s) => (s.indexOf(',') >= 0 ? s.replace(/0+$/, '').replace(/,$/, '') : s);

  function split3(n) {
    let e3 = Math.floor(Math.log10(n) / 3);
    let m = n / Math.pow(10, e3 * 3);
    if (m >= 1000) { m /= 1000; e3++; }
    if (m < 1) { m *= 1000; e3--; }
    return [m, e3];
  }
  function sci(n, steady) {
    let e = Math.floor(Math.log10(n));
    let m = n / Math.pow(10, e);
    if (m >= 10) { m /= 10; e++; }
    const s = dec(trunc(m, 2), 2);
    return (steady ? s : trimZeros(s)) + 'e' + e;
  }
  /** Mantisse: 3 signifikante Stellen (kompakt) bzw. feste Stellen (steady, für große Zähler) */
  function mant(m, steady) {
    const d = steady ? (m >= 100 ? 1 : 2) : (m >= 100 ? 0 : m >= 10 ? 1 : 2);
    const s = dec(trunc(m, d), d);
    return steady ? s : trimZeros(s);
  }

  /** Zahl formatieren. opts.dec: Nachkommastellen für kleine Werte, opts.steady: feste Breite, opts.words: Zahlwort ausschreiben */
  U.fmt = function (n, opts) {
    opts = opts || {};
    if (n !== n || n === undefined || n === null) return '0';
    if (n === Infinity) return '∞';
    if (n < 0) return '−' + U.fmt(-n, opts);
    if (n < 1000) {
      if (opts.dec && n < 100 && n % 1 !== 0) return trimZeros(dec(trunc(n, opts.dec), opts.dec));
      return String(Math.floor(n));
    }
    if (n < 1e6) return group(n);
    if (U.numFmt === 'wiss') return sci(n, opts.steady);
    const [m, e3] = split3(n);
    if (e3 >= SHORT.length) return sci(n, opts.steady);
    const ms = mant(m, opts.steady);
    if (U.numFmt === 'lang' || opts.words) {
      const one = ms === '1' || ms === '1,00';
      return ms + ' ' + (one ? LONG[e3] : plural(LONG[e3]));
    }
    return ms + ' ' + SHORT[e3];
  };
  /** Für den großen Zähler: { num: "12,63", word: "Millionen" } */
  U.fmtParts = function (n) {
    if (!(n >= 1e6) || !isFinite(n)) return { num: U.fmt(Math.max(0, n || 0)), word: '' };
    if (U.numFmt === 'wiss') return { num: sci(n, true), word: '' };
    const [m, e3] = split3(n);
    if (e3 >= LONG.length) return { num: sci(n, true), word: '' };
    const ms = mant(m, true);
    return { num: ms, word: ms === '1,00' ? LONG[e3] : plural(LONG[e3]) };
  };
  /** Kleine Dezimalzahl mit höchstens d Nachkommastellen, ohne angehängte Nullen */
  U.dec = (x, d) => trimZeros(dec(x, d === undefined ? 1 : d));
  U.pct = (x, d) => U.dec(x * 100, d === undefined ? 0 : d) + ' %';
  U.mult = (x) => '×' + (x >= 1000 ? U.fmt(x) : U.dec(x, x < 10 ? 2 : 1));

  /* ---------- Zeit ---------- */
  U.fmtTime = function (s) {
    s = Math.max(0, Math.floor(s));
    if (s < 60) return s + ' Sek.';
    const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (s < 3600) return m + ' Min.' + (s % 60 ? ' ' + (s % 60) + ' Sek.' : '');
    if (s < 86400) return h + ' Std.' + (m % 60 ? ' ' + (m % 60) + ' Min.' : '');
    return d + (d === 1 ? ' Tag' : ' Tage') + (h % 24 ? ' ' + (h % 24) + ' Std.' : '');
  };
  U.clock = function (s) {
    s = Math.max(0, Math.ceil(s));
    return s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + ' s';
  };

  /* ---------- Zufall (austauschbar für Simulationen) ---------- */
  let rnd = Math.random;
  U.setRandom = (fn) => { rnd = fn; };
  U.rand = () => rnd();
  U.range = (a, b) => a + rnd() * (b - a);
  U.randInt = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  U.pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  U.weighted = function (list, wf) {
    let sum = 0;
    for (const x of list) sum += Math.max(0, wf(x));
    let r = rnd() * sum;
    for (const x of list) { r -= Math.max(0, wf(x)); if (r <= 0) return x; }
    return list[list.length - 1];
  };
  U.mulberry32 = function (a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  /* ---------- Kleinkram ---------- */
  U.clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.clone = (o) => JSON.parse(JSON.stringify(o));
  U.hash = function (str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(36);
  };
  // Unicode-sicheres Base64
  U.toB64 = function (str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
  };
  U.fromB64 = function (b64) {
    const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  };
  U.roman = function (n) {
    const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let r = '';
    for (const [v, s] of map) while (n >= v) { r += s; n -= v; }
    return r;
  };

  /* ---------- Ereignis-Bus ---------- */
  const handlers = {};
  U.on = (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); };
  U.off = (ev, fn) => { handlers[ev] = (handlers[ev] || []).filter((f) => f !== fn); };
  U.emit = (ev, data) => {
    const list = handlers[ev];
    if (!list) return;
    for (const fn of list) {
      try { fn(data); } catch (e) { if (typeof console !== 'undefined') console.error('[' + ev + ']', e); }
    }
  };
  U.clearHandlers = () => { for (const k in handlers) delete handlers[k]; };
})(typeof window !== 'undefined' ? window : globalThis);

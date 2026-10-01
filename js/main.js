'use strict';
/* Amtsschimmel – Start, Hauptschleife, Speichern, Tastatur, Sichtbarkeit, Service Worker. */
(function (root) {
  const AS = root.AS;
  const U = AS.U, C = AS.Core;
  const Main = (AS.Main = {});

  // Speicher mit Fehlerbehandlung (Privatmodus, voller Speicher, gesperrte Cookies)
  const mem = {};
  let lsOk = true;
  try { const k = '__as_test'; localStorage.setItem(k, '1'); localStorage.removeItem(k); } catch (e) { lsOk = false; }
  C.storage = {
    get: (k) => { try { return lsOk ? localStorage.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return null; } },
    set: (k, v) => { if (lsOk) localStorage.setItem(k, v); else mem[k] = v; },
    remove: (k) => { try { if (lsOk) localStorage.removeItem(k); else delete mem[k]; } catch (e) { /* egal */ } },
  };

  Main.save = function () { return C.save(); };
  Main.afterLoad = function () {
    document.body.dataset.era = C.get().era;
    AS.Audio.setEra(C.get().era);
    AS.UI.applySettings();
    AS.Desk.reset();
    AS.UI.refresh();
  };

  let last = performance.now(), lastFrame = performance.now(), slowAcc = 0, saveAcc = 0;
  function logic() {
    const now = performance.now();
    let dt = (now - last) / 1000;
    last = now;
    if (dt <= 0) return;
    if (dt > 6 * 3600) dt = 6 * 3600;
    C.tick(dt);
    slowAcc += dt; saveAcc += dt;
    if (slowAcc >= 0.25) { slowAcc = 0; try { AS.UI.slow(); AS.Desk.slow(); } catch (e) { console.error(e); } }
    if (saveAcc >= 15) { saveAcc = 0; Main.save(); }
  }
  function frame(now) {
    const dt = Math.min(0.25, (now - lastFrame) / 1000);
    lastFrame = now;
    try { AS.UI.frame(dt); AS.Desk.update(dt); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }

  function onKey(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (document.querySelector('.modal-back, .finale')) return;
    const k = e.key;
    if (k === ' ' || k === 'Spacebar') {
      if (t && t.closest && t.closest('button, [role="button"]:not(.doc), a')) return;
      e.preventDefault();
      if (!e.repeat) AS.Desk.eingang();
      return;
    }
    if (/^[1-6]$/.test(k)) { e.preventDefault(); AS.Desk.ressort(Number(k) - 1); return; }
    if (k === 'b' || k === 'B') { C.buyAllUpgrades(); return; }
    if (k === 'm' || k === 'M') { const st = C.get().settings; st.sound = !st.sound; AS.UI.applySettings(); return; }
  }

  function boot() {
    const info = C.load();
    AS.Desk.init();
    AS.UI.init();
    AS.UI.loadInfo(info);
    if (!lsOk) AS.UI.toast({ icon: 'widerspruch', kicker: 'Hinweis', title: 'Speichern nicht möglich', text: 'Der Browser erlaubt keinen lokalen Speicher. Exportiere deinen Spielstand regelmäßig.', cls: 'red', ms: 9000 });
    C.visible = !document.hidden;
    document.addEventListener('visibilitychange', () => {
      C.visible = !document.hidden;
      if (document.hidden) Main.save();
      else last = performance.now() - Math.min(performance.now() - last, 6 * 3600 * 1000);
    });
    window.addEventListener('pagehide', Main.save);
    window.addEventListener('beforeunload', Main.save);
    document.addEventListener('keydown', onKey);
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, () => AS.Audio.unlock(), { once: true, passive: true }));
    setInterval(logic, 100);
    requestAnimationFrame(frame);
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline-fähig ist ein Bonus */ });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);

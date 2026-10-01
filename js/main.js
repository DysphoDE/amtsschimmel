'use strict';
/* Amtsschimmel – Start, Hauptschleife, Speichern, Tastatur, Sichtbarkeit, Tab-Sperre, Service Worker. */
(function (root) {
  const AS = root.AS;
  const C = AS.Core;
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

  /* Speichern mit Schutz vor fremden, neueren Ständen (anderer oder eingefrorener Tab) */
  const META = 'amtsschimmel.meta';
  let lastOwnWrite = 0;
  const readMeta = () => { try { return JSON.parse(C.storage.get(META) || 'null'); } catch (e) { return null; } };
  Main.save = function () {
    if (C.readOnly) return false;
    const m = readMeta();
    if (m && m.tab !== tabId && m.t > lastOwnWrite) {
      // Seit unserem letzten Speichern hat ein anderer Tab gespeichert: nicht überschreiben
      block('In einem anderen Tab wurde inzwischen weitergespielt.');
      return false;
    }
    const ok = C.save();
    if (ok) { lastOwnWrite = Date.now(); try { C.storage.set(META, JSON.stringify({ tab: tabId, t: lastOwnWrite })); } catch (e) { /* egal */ } }
    return ok;
  };
  Main.afterLoad = function () {
    document.body.dataset.era = C.get().era;
    AS.Audio.setEra(C.get().era);
    AS.UI.applySettings();
    AS.Desk.reset();
    AS.UI.refresh();
  };

  /* ---------- Nur ein Tab speichert ---------- */
  const LOCK = 'amtsschimmel.lock';
  // Die Tab-ID bleibt beim Neuladen desselben Tabs erhalten (sessionStorage gilt pro Tab).
  // Ein duplizierter Tab erbt den sessionStorage, ist aber kein Neuladen – dann gibt es eine neue ID.
  let tabId = null;
  let isReload = false;
  try { const nav = performance.getEntriesByType('navigation')[0]; isReload = !!nav && nav.type === 'reload'; } catch (e) { isReload = false; }
  try { tabId = isReload ? sessionStorage.getItem('amtsschimmel.tabid') : null; } catch (e) { tabId = null; }
  if (!tabId) { tabId = Math.random().toString(36).slice(2); try { sessionStorage.setItem('amtsschimmel.tabid', tabId); } catch (e) { /* egal */ } }
  const releaseLock = () => { const l = readLock(); if (l && l.id === tabId) C.storage.remove(LOCK); };
  let blocked = false, blockModal = null;
  const readLock = () => { try { return JSON.parse(C.storage.get(LOCK) || 'null'); } catch (e) { return null; } };
  const writeLock = () => { try { C.storage.set(LOCK, JSON.stringify({ id: tabId, t: Date.now() })); } catch (e) { /* egal */ } };
  function block(text) {
    if (blocked) return;
    blocked = true;
    C.readOnly = true;
    blockModal = AS.UI.modal('<h2>Schon in einem anderen Tab geöffnet</h2><p>' + text + '</p><p class="small muted">Damit sich zwei Tabs nicht gegenseitig den Spielstand überschreiben, wird hier gerade nicht gespeichert.</p>' +
      '<div class="modal-actions"><button class="btn primary" type="button" data-take autofocus>Hier weiterspielen</button></div>', { noClose: true });
    blockModal.el.querySelector('[data-take]').addEventListener('click', takeOver);
  }
  function takeOver() {
    if (blockModal) { blockModal.close(); blockModal = null; }
    blocked = false;
    C.readOnly = !!C.futureLock;
    writeLock();
    const info = C.load(); // den neuesten Stand des anderen Tabs übernehmen
    lastOwnWrite = Date.now();
    Main.afterLoad();
    if (info.offline) AS.UI.offlineReport(info.offline);
  }
  // Import, Wiederherstellen oder Zurücksetzen hier: dieser Tab übernimmt bewusst
  C.onUnlock = function () {
    if (blockModal) { blockModal.close(); blockModal = null; }
    blocked = false;
    writeLock();
    lastOwnWrite = Date.now() + 1;
  };
  function heartbeat() {
    const l = readLock();
    if (l && l.id !== tabId && Date.now() - l.t < 12000) {
      if (!blocked) block('In einem anderen Tab wurde zuletzt weitergespielt.');
      return;
    }
    if (!blocked) writeLock();
  }

  /* ---------- Schleifen ---------- */
  // Die Uhrzeit (nicht performance.now) misst auch Standby und Ruhezustand richtig.
  let last = Date.now(), lastFrame = performance.now(), slowAcc = 0, saveAcc = 0, beatAcc = 0;
  const OFFLINE_GAP = 300;
  let pendingReport = null;
  function logic() {
    const now = Date.now();
    const dt = (now - last) / 1000;
    last = now;
    if (!(dt > 0)) return; // Uhr zurückgestellt: nichts tun
    if (dt > OFFLINE_GAP) {
      // Längere Lücke (Standby, gedrosselter Hintergrund-Tab): wie Abwesenheit abrechnen
      const r = C.applyOffline(dt);
      if (r && r.gain > 0) { if (document.hidden) pendingReport = r; else AS.UI.offlineReport(r); }
    } else C.tick(dt);
    slowAcc += dt; saveAcc += dt; beatAcc += dt;
    if (slowAcc >= 0.25) { slowAcc = 0; try { AS.UI.slow(); AS.Desk.slow(); } catch (e) { console.error(e); } }
    if (beatAcc >= 4) { beatAcc = 0; heartbeat(); }
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
      if (t && t.closest && t.closest('button, [role="button"]:not(.doc), a, summary')) return;
      e.preventDefault();
      if (!e.repeat) AS.Desk.eingang();
      return;
    }
    if (/^[1-6]$/.test(k)) { e.preventDefault(); if (!e.repeat) AS.Desk.ressort(Number(k) - 1); return; }
    if (e.repeat) return;
    if (k === 'b' || k === 'B') { C.buyAllUpgrades(); return; }
    if (k === 'm' || k === 'M') { const st = C.get().settings; st.sound = !st.sound; AS.UI.applySettings(); return; }
  }

  function registerSW() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol) || /localhost|127\.0\.0\.1/.test(location.hostname)) return;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          // Nur ein echtes Update melden: Beim ersten Besuch gibt es noch keinen steuernden Service Worker
          if (nw.state === 'installed' && hadController) {
            Main.save();
            AS.UI.toast({ icon: 'stern', kicker: 'Neue Version', title: 'Das Amt wurde modernisiert', text: 'Hier tippen, um die neue Version zu laden.', ms: 20000, onClick: () => { Main.save(); location.reload(); } });
          }
        });
      });
    }).catch(() => { /* offline-fähig ist ein Bonus */ });
  }

  function boot() {
    const prior = readLock();
    const info = C.load();
    AS.Desk.init();
    AS.UI.init();
    AS.UI.loadInfo(info);
    if (!lsOk) AS.UI.toast({ icon: 'widerspruch', kicker: 'Hinweis', title: 'Speichern nicht möglich', text: 'Der Browser erlaubt keinen lokalen Speicher. Exportiere deinen Spielstand regelmäßig.', cls: 'red', ms: 9000 });
    if (prior && prior.id !== tabId && Date.now() - prior.t < 12000) block('Amtsschimmel läuft bereits in einem anderen Tab oder Fenster.');
    else writeLock();
    lastOwnWrite = Date.now();
    window.addEventListener('storage', (e) => { if (e.key === LOCK) heartbeat(); });
    C.visible = !document.hidden;
    document.addEventListener('visibilitychange', () => {
      C.visible = !document.hidden;
      if (document.hidden) Main.save();
      else { heartbeat(); if (pendingReport) { AS.UI.offlineReport(pendingReport); pendingReport = null; } }
    });
    window.addEventListener('pagehide', () => { Main.save(); releaseLock(); });
    // Rückkehr aus dem Zwischenspeicher des Browsers (bfcache) oder aus dem Einfrieren
    window.addEventListener('pageshow', (e) => { if (e.persisted) heartbeat(); });
    document.addEventListener('resume', heartbeat);
    window.addEventListener('beforeunload', Main.save);
    document.addEventListener('keydown', onKey);
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, () => AS.Audio.unlock(), { once: true, passive: true }));
    setInterval(logic, 100);
    requestAnimationFrame(frame);
    registerSW();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);

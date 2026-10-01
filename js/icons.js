'use strict';
/* Amtsschimmel – Grafiken als Inline-SVG. Einheitlicher Stil: 32er-Raster, dunkle Kontur, flache Farben. */
(function (root) {
  const AS = (root.AS = root.AS || {});
  const K = '#2b2420';
  const st = 'stroke="' + K + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
  const svg = (body, vb) => '<svg viewBox="' + (vb || '0 0 32 32') + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + body + '</svg>';

  const I = {
    /* ---- Währungen & Allgemeines ---- */
    akte: svg(`<path d="M4 9h9l2 3h13v14H4z" fill="#e2c27a" ${st}/><path d="M7 6h15v8H7z" fill="#fbf6e9" ${st}/><path d="M9.5 9h10M9.5 11.5h7" stroke="#8a7b6b" stroke-width="1.2"/><path d="M4 13h24v13H4z" fill="#ebcd85" ${st}/>`),
    para: svg(`<circle cx="16" cy="16" r="12.5" fill="#efe3c4" ${st}/><text x="16" y="22.5" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="700" fill="${K}">§</text>`),
    dj: svg(`<path d="M9 4h14M9 28h14" ${st} fill="none"/><path d="M10 4c0 7 5 8 6 12-1 4-6 5-6 12h12c0-7-5-8-6-12 1-4 6-5 6-12z" fill="#f4e7c3" ${st}/><path d="M12.5 26c1-3 2.5-4 3.5-4.5 1 .5 2.5 1.5 3.5 4.5z" fill="#c9a24a"/><path d="M13 8h6c-1 2-2 3-3 4-1-1-2-2-3-4z" fill="#c9a24a"/>`),
    pp: svg(`<circle cx="16" cy="16" r="12" fill="#e9c46a" ${st}/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#a8780a" stroke-width="1.3"/><text x="16" y="20.5" text-anchor="middle" font-family="Georgia,serif" font-size="12" font-weight="700" fill="${K}">P</text>`),
    stempel: svg(`<path d="M12 3h8v4c0 2 2 3 2 6h-12c0-3 2-4 2-6z" fill="#8d5a3b" ${st}/><path d="M7 13h18v5H7z" fill="#5b3a24" ${st}/><path d="M6 18h20v4H6z" fill="#b3261e" ${st}/><path d="M5 26h22" stroke="#b3261e" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`),
    eingang: svg(`<path d="M3 14l4-8h18l4 8v12H3z" fill="#c9cfd6" ${st}/><path d="M7 10h18v8H7z" fill="#fbf6e9" ${st}/><path d="M3 14h8l2 4h6l2-4h8v12H3z" fill="#9aa6b2" ${st}/>`),
    uhr: svg(`<circle cx="16" cy="16" r="12" fill="#fbf6e9" ${st}/><path d="M16 9v7l5 3" ${st} fill="none"/>`),
    kaffee: svg(`<path d="M6 12h16v8a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" fill="#fbf6e9" ${st}/><path d="M22 14h2a3 3 0 0 1 0 6h-2" fill="none" ${st}/><path d="M8 14h12v3H8z" fill="#7a4a2a"/><path d="M11 4c-1 2 1 3 0 5M15 4c-1 2 1 3 0 5M19 4c-1 2 1 3 0 5" fill="none" stroke="#8a7b6b" stroke-width="1.3" stroke-linecap="round"/>`),
    urkunde: svg(`<path d="M5 5h22v18H5z" fill="#fbf6e9" ${st}/><path d="M9 10h14M9 13.5h10M9 17h8" stroke="#8a7b6b" stroke-width="1.3"/><circle cx="22" cy="21" r="4.5" fill="#c9a24a" ${st}/><path d="M19.5 24.5l-1.5 5 4-2 4 2-1.5-5" fill="#b3261e" ${st}/>`),
    album: svg(`<path d="M6 4h18a2 2 0 0 1 2 2v22H8a2 2 0 0 1-2-2z" fill="#3f6b5a" ${st}/><path d="M6 24a2 2 0 0 1 2-2h18" fill="none" ${st}/><path d="M11 8h10v9H11z" fill="#fbf6e9" ${st}/><path d="M13 11h6M13 14h4" stroke="#8a7b6b" stroke-width="1.2"/>`),
    amt: svg(`<path d="M3 12l13-7 13 7z" fill="#d9cdb4" ${st}/><path d="M5 12h22v3H5zM5 25h22v3H5z" fill="#efe3c4" ${st}/><path d="M7 15h3v10H7zM14.5 15h3v10h-3zM22 15h3v10h-3z" fill="#fbf6e9" ${st}/>`),
    reform: svg(`<path d="M16 4v24M8 28h16" ${st} fill="none"/><path d="M6 9h20" ${st}/><path d="M6 9l-4 9h8zM26 9l-4 9h8z" fill="#efe3c4" ${st}/><circle cx="16" cy="6" r="2" fill="#c9a24a" ${st}/>`),
    laufbahn: svg(`<path d="M4 27h6v-6h6v-6h6V9h6" fill="none" ${st}/><path d="M24 5h4v4" fill="none" ${st}/><circle cx="7" cy="23" r="2.5" fill="#e9c46a" ${st}/>`),
    stats: svg(`<path d="M5 27h22" ${st}/><path d="M7 18h4v9H7zM14 11h4v16h-4zM21 6h4v21h-4z" fill="#9db7a6" ${st}/>`),
    optionen: svg(`<circle cx="16" cy="16" r="4" fill="#fbf6e9" ${st}/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8" ${st}/><circle cx="16" cy="16" r="9" fill="none" ${st}/>`),
    ton: svg(`<path d="M5 12h5l7-6v20l-7-6H5z" fill="#efe3c4" ${st}/><path d="M21 11c2 2 2 8 0 10M24 8c4 4 4 12 0 16" fill="none" ${st}/>`),
    tonaus: svg(`<path d="M5 12h5l7-6v20l-7-6H5z" fill="#efe3c4" ${st}/><path d="M21 12l7 8M28 12l-7 8" ${st}/>`),
    musik: svg(`<path d="M12 22V7l14-3v15" fill="none" ${st}/><ellipse cx="9" cy="22" rx="4" ry="3" fill="#efe3c4" ${st}/><ellipse cx="23" cy="19" rx="4" ry="3" fill="#efe3c4" ${st}/>`),
    musikaus: svg(`<path d="M12 22V7l14-3v15" fill="none" ${st}/><ellipse cx="9" cy="22" rx="4" ry="3" fill="#efe3c4" ${st}/><ellipse cx="23" cy="19" rx="4" ry="3" fill="#efe3c4" ${st}/><path d="M4 4l24 24" stroke="#b3261e" stroke-width="2.4" stroke-linecap="round"/>`),
    info: svg(`<circle cx="16" cy="16" r="12" fill="#fbf6e9" ${st}/><path d="M16 14v8" ${st}/><circle cx="16" cy="10" r="1.6" fill="${K}"/>`),
    zu: svg(`<path d="M8 8l16 16M24 8L8 24" ${st} stroke-width="2.4"/>`),
    haken: svg(`<path d="M6 17l6 6 14-14" fill="none" ${st} stroke-width="2.6"/>`),
    schloss: svg(`<path d="M10 14v-4a6 6 0 0 1 12 0v4" fill="none" ${st}/><path d="M7 14h18v13H7z" fill="#c9cfd6" ${st}/><circle cx="16" cy="20" r="2" fill="${K}"/>`),
    stern: svg(`<path d="M16 3l3.8 8 8.7 1-6.4 6 1.7 8.6L16 22.4 8.2 26.6 9.9 18 3.5 12l8.7-1z" fill="#e9c46a" ${st}/>`),
    flugzeug: svg(`<path d="M3 18l9-2 6-10h3l-2 9 8-1 2-3h2l-1 5 1 5h-2l-2-3-8-1 2 9h-3l-6-10-9-2z" fill="#dfe6ee" ${st}/>`),
    knopf: svg(`<circle cx="16" cy="18" r="11" fill="#5b3a24" ${st}/><circle cx="16" cy="15" r="9" fill="#d23b2f" ${st}/><ellipse cx="13" cy="12" rx="3" ry="1.8" fill="#fff" opacity=".45"/>`),
    telefon: svg(`<path d="M5 12c0-4 22-4 22 0v3h-6v-3c-3-1-7-1-10 0v3H5z" fill="#3b4a5a" ${st}/><path d="M8 16h16l2 10H6z" fill="#5a6b7c" ${st}/><circle cx="16" cy="21" r="3" fill="#dfe6ee" ${st}/>`),
    altpapier: svg(`<path d="M7 9h18l-2 19H9z" fill="#4e7da6" ${st}/><path d="M5 6h22v3H5z" fill="#6b97bf" ${st}/><path d="M11 13l2 11M16 13v11M21 13l-2 11" stroke="#2c4f70" stroke-width="1.4"/>`),
    fluss: svg(`<path d="M3 20c4-6 6 6 10 0s6 6 10 0 4-3 6-3" fill="none" ${st} stroke-width="2.2"/><path d="M3 13c4-6 6 6 10 0s6 6 10 0 4-3 6-3" fill="none" stroke="#2a62a8" stroke-width="2.2" stroke-linecap="round"/>`),
    eilt: svg(`<path d="M16 3l13 23H3z" fill="#e3553f" ${st}/><path d="M16 11v7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="22" r="1.6" fill="#fff"/>`),
    widerspruch: svg(`<path d="M6 5h20v22H6z" fill="#fbf6e9" ${st}/><path d="M10 10h12M10 14h9" stroke="#8a7b6b" stroke-width="1.3"/><path d="M9 25l14-8" stroke="#b3261e" stroke-width="3" stroke-linecap="round"/><path d="M20 21l3-4 1 5" fill="none" stroke="#b3261e" stroke-width="2" stroke-linecap="round"/>`),

    /* ---- Ressorts ---- */
    r_bau: svg(`<path d="M4 15L16 5l12 10" fill="none" ${st} stroke-width="2"/><path d="M7 13v14h18V13" fill="#fbf6e9" ${st}/><path d="M13 27v-8h6v8" fill="#e7b9a8" ${st}/><path d="M21 7h3v5" fill="none" ${st}/>`),
    r_ord: svg(`<path d="M16 3l11 4v7c0 7-5 12-11 15C10 26 5 21 5 14V7z" fill="#dce6f5" ${st}/><path d="M11 15l3.5 3.5L21.5 11" fill="none" ${st} stroke-width="2.2"/>`),
    r_fin: svg(`<circle cx="16" cy="16" r="12" fill="#f2dc8f" ${st}/><path d="M21 10.5a7 7 0 1 0 0 11M8.5 14h9M8.5 18h9" fill="none" ${st} stroke-width="1.9"/>`),
    r_soz: svg(`<path d="M16 27C6 20 3 15 3 10.5A6 6 0 0 1 16 8a6 6 0 0 1 13 2.5C29 15 26 20 16 27z" fill="#bfe3c7" ${st}/>`),
    r_umw: svg(`<path d="M6 26C6 13 13 5 27 5c0 14-8 21-21 21z" fill="#a9dccf" ${st}/><path d="M6 26C11 19 16 15 21 11" fill="none" ${st}/>`),
    r_kul: svg(`<path d="M4 7c4-2 8-2 12 1v19c-4-3-8-3-12-1z" fill="#e2d0ee" ${st}/><path d="M28 7c-4-2-8-2-12 1v19c4-3 8-3 12-1z" fill="#f2e8f8" ${st}/>`),

    /* ---- Generatoren ---- */
    schreiber: svg(`<rect x="4" y="6" width="17" height="21" rx="3" fill="#c9a27a" ${st}/><path d="M8 11l2 1-2 1M12 11l2 1-2 1M8 16l2 1-2 1M13 16h3M8 21l2 1-2 1M12 21h4" stroke="#6b4a2c" stroke-width="1.3" fill="none"/><path d="M18 26L28 6" stroke="#8d5a3b" stroke-width="2.6" stroke-linecap="round"/><path d="M28 6l1-2" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/>`),
    siegel: svg(`<rect x="5" y="6" width="9" height="20" rx="3" fill="#7d9bb5" ${st}/><path d="M7 10h5M7 14h5M7 18h5M7 22h5" stroke="#46627a" stroke-width="1.2"/><circle cx="22" cy="18" r="7" fill="#b3261e" ${st}/><path d="M19 18l2 2 4-4" fill="none" stroke="#f6d3cf" stroke-width="1.8" stroke-linecap="round"/>`),
    tabularium: svg(`<path d="M3 11L16 4l13 7z" fill="#efe9dc" ${st}/><path d="M4 11h24v2H4zM4 26h24v3H4z" fill="#e2d9c6" ${st}/><path d="M7 13h3v13H7zM14.5 13h3v13h-3zM22 13h3v13h-3z" fill="#fbf8f0" ${st}/>`),
    bote: svg(`<path d="M4 9h18v14H4z" fill="#fbf6e9" ${st}/><path d="M4 9l9 8 9-8" fill="none" ${st}/><circle cx="13" cy="19" r="3" fill="#b3261e" ${st}/><path d="M24 12h5M25 16h4M24 20h5" stroke="#8a7b6b" stroke-width="1.6" stroke-linecap="round"/>`),
    kanzlist: svg(`<path d="M8 20h11v7H8z" fill="#3b3b4a" ${st}/><path d="M7 20h13" ${st}/><path d="M14 20C14 12 20 5 28 3c-1 7-6 13-12 17" fill="#fbfbff" ${st}/><path d="M15 19c3-4 6-8 10-12" fill="none" stroke="#9aa6b2" stroke-width="1.2"/>`),
    amtsstube: svg(`<path d="M4 13L16 5l12 8v15H4z" fill="#f1e2bf" ${st}/><path d="M4 13h24M10 13v15M22 13v15M4 20h24" stroke="#8d5a3b" stroke-width="1.5"/><path d="M13 28v-6h6v6" fill="#8d5a3b" ${st}/><path d="M12 15h8v4h-8z" fill="#cfe3f0" ${st}/>`),
    registratur: svg(`<rect x="6" y="3" width="20" height="26" rx="1.5" fill="#a77b52" ${st}/><path d="M6 11.5h20M6 20h20" ${st}/><path d="M13 7h6M13 15.5h6M13 24h6" stroke="#f1e2bf" stroke-width="2" stroke-linecap="round"/>`),
    sekretaer: svg(`<circle cx="16" cy="15" r="9" fill="#f0c8a0" ${st}/><path d="M7 13c0-6 4-8 9-8s9 2 9 8c-2-2-5-3-9-3s-7 1-9 3z" fill="#5b4636" ${st}/><circle cx="12.5" cy="15" r="2.5" fill="none" ${st}/><circle cx="19.5" cy="15" r="2.5" fill="none" ${st}/><path d="M15 15h2" ${st}/><path d="M11 20c2 1.5 8 1.5 10 0" fill="#5b4636" ${st}/><path d="M8 28c1-3 4-4 8-4s7 1 8 4" fill="#2f3b52" ${st}/>`),
    rohrpost: svg(`<path d="M3 8h8v16H3M29 8h-8v16h8" fill="#c9cfd6" ${st}/><rect x="10" y="12" width="12" height="8" rx="4" fill="#c99a3b" ${st}/><path d="M14 12v8M18 12v8" stroke="#8a6420" stroke-width="1.2"/>`),
    schreibstube: svg(`<path d="M9 5h14v8H9z" fill="#fbf6e9" ${st}/><path d="M4 14h24l-2 12H6z" fill="#3b4a3f" ${st}/><path d="M8 18h2M12 18h2M16 18h2M20 18h2M10 21.5h12" stroke="#e8e2d0" stroke-width="1.6" stroke-linecap="round"/><path d="M3 14h26" ${st}/>`),
    fax: svg(`<path d="M10 3h12v10H10z" fill="#fbf6e9" ${st}/><path d="M12 6h8M12 9h6" stroke="#8a7b6b" stroke-width="1.2"/><path d="M4 12h24v14H4z" fill="#d6d1c4" ${st}/><path d="M7 15h9v4H7z" fill="#5d7a5d" ${st}/><path d="M19 15h2M23 15h2M19 19h2M23 19h2M19 23h2M23 23h2" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/>`),
    kopierer: svg(`<path d="M5 9h22v17H5z" fill="#e6e2d8" ${st}/><path d="M4 7h24v3H4z" fill="#a9b3bd" ${st}/><path d="M9 26v3h14v-3" fill="#fbf6e9" ${st}/><path d="M8 13h16v3H8z" fill="#7fd3a0" ${st}/><circle cx="22" cy="21" r="1.6" fill="#3fa36b"/>`),
    grossrechner: svg(`<rect x="4" y="4" width="24" height="24" rx="1.5" fill="#d8d2c2" ${st}/><circle cx="11" cy="12" r="4" fill="#fbf6e9" ${st}/><circle cx="21" cy="12" r="4" fill="#fbf6e9" ${st}/><circle cx="11" cy="12" r="1" fill="${K}"/><circle cx="21" cy="12" r="1" fill="${K}"/><path d="M7 20h18M7 24h18" stroke="#8a7b6b" stroke-width="1.4"/><circle cx="24" cy="20" r="1" fill="#d23b2f"/>`),
    terminal: svg(`<rect x="4" y="4" width="24" height="18" rx="2" fill="#d8d2c2" ${st}/><rect x="7" y="7" width="18" height="12" fill="#10261a" ${st}/><path d="M9 10h6M9 13h9M9 16h4" stroke="#5cff8a" stroke-width="1.3"/><path d="M10 22l-2 5h16l-2-5" fill="#c9c2b0" ${st}/>`),
    fachverfahren: svg(`<rect x="3" y="5" width="26" height="21" rx="2" fill="#fbfbff" ${st}/><path d="M3 10h26" ${st}/><circle cx="6.5" cy="7.5" r="1" fill="#d23b2f"/><circle cx="9.5" cy="7.5" r="1" fill="#e9c46a"/><path d="M16 13l6 10H10z" fill="#f2c94c" ${st}/><path d="M16 16v3" stroke="${K}" stroke-width="1.6"/><circle cx="16" cy="21" r=".8" fill="${K}"/>`),
    eakte: svg(`<path d="M4 9h9l2 3h13v14H4z" fill="#5b8fd1" ${st}/><path d="M4 13h24v13H4z" fill="#7aa9e6" ${st}/><text x="16" y="23" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="700" fill="#fff">PDF</text>`),
    ki: svg(`<rect x="7" y="9" width="18" height="15" rx="4" fill="#cfe6f5" ${st}/><circle cx="12.5" cy="16" r="2.2" fill="#2a62a8"/><circle cx="19.5" cy="16" r="2.2" fill="#2a62a8"/><path d="M13 21h6" ${st}/><path d="M16 9V5" ${st}/><circle cx="16" cy="4" r="1.8" fill="#e3553f" ${st}/><path d="M7 15H4M28 15h-3" ${st}/>`),
    weltamt: svg(`<circle cx="16" cy="16" r="11" fill="#3d6fb5" ${st}/><path d="M9 11c3 0 4 2 6 2s2 3 0 4-1 4-4 4M20 7c0 3 3 3 3 5s3 2 4 1M18 21c2-1 4 0 4 3" fill="#6fbf73" stroke="${K}" stroke-width="1.2"/><ellipse cx="16" cy="16" rx="15" ry="4.5" fill="none" stroke="#e9c46a" stroke-width="1.6" transform="rotate(-18 16 16)"/>`),

    /* ---- Gremien ---- */
    ausschuss: svg(`<ellipse cx="16" cy="17" rx="10" ry="6" fill="#a77b52" ${st}/><circle cx="16" cy="7" r="2.6" fill="#e2c27a" ${st}/><circle cx="4.5" cy="17" r="2.6" fill="#9db7a6" ${st}/><circle cx="27.5" cy="17" r="2.6" fill="#e7b9a8" ${st}/><circle cx="9" cy="26" r="2.6" fill="#b9c7e6" ${st}/><circle cx="23" cy="26" r="2.6" fill="#e2d0ee" ${st}/>`),
    arbeitskreis: svg(`<circle cx="16" cy="16" r="9" fill="none" stroke="#8a7b6b" stroke-width="1.4" stroke-dasharray="2 2"/><circle cx="16" cy="6" r="3" fill="#e2c27a" ${st}/><circle cx="25.5" cy="13" r="3" fill="#9db7a6" ${st}/><circle cx="22" cy="24.5" r="3" fill="#e7b9a8" ${st}/><circle cx="10" cy="24.5" r="3" fill="#b9c7e6" ${st}/><circle cx="6.5" cy="13" r="3" fill="#e2d0ee" ${st}/>`),
    kommission: svg(`<path d="M9 14h14l-2 14H11z" fill="#8d5a3b" ${st}/><path d="M7 12h18v3H7z" fill="#a77b52" ${st}/><path d="M16 12V7" ${st}/><rect x="13.5" y="3" width="5" height="5" rx="2.5" fill="#3b4a5a" ${st}/><path d="M12 20h8" stroke="#e2c27a" stroke-width="1.6"/>`),
    beirat: svg(`<path d="M3 6h16v10H9l-4 4v-4H3z" fill="#fbf6e9" ${st}/><path d="M13 13h16v10h-2v4l-4-4H13z" fill="#cfe6f5" ${st}/><path d="M6 10h10M17 17h9M17 20h6" stroke="#8a7b6b" stroke-width="1.2"/>`),
    weltrat: svg(`<circle cx="16" cy="16" r="12" fill="#cfe6f5" ${st}/><circle cx="16" cy="16" r="5" fill="#3d6fb5" ${st}/><g fill="#e9c46a" stroke="${K}" stroke-width=".8"><circle cx="16" cy="6.5" r="1.6"/><circle cx="25" cy="13" r="1.6"/><circle cx="21.5" cy="24" r="1.6"/><circle cx="10.5" cy="24" r="1.6"/><circle cx="7" cy="13" r="1.6"/></g>`),
  };

  /* ---- Der Amtsschimmel (Seitenansicht, Beine einzeln animierbar) ---- */
  I.schimmel = svg(`
    <g class="sch-tail"><path d="M22 36c-8 2-12 10-13 22 5-4 8-9 9-14 1 6 4 9 8 11-3-6-3-13-4-19z" fill="#d9d9e3" stroke="${K}" stroke-width="2" stroke-linejoin="round"/></g>
    <g class="sch-leg sch-leg-b1"><path d="M32 50l-2 26h7l2-26z" fill="#f4f4fa" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M29.5 74h8v5h-8z" fill="#5b4636" stroke="${K}" stroke-width="2"/></g>
    <g class="sch-leg sch-leg-f1"><path d="M74 50l-2 26h7l2-26z" fill="#f4f4fa" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M71.5 74h8v5h-8z" fill="#5b4636" stroke="${K}" stroke-width="2"/></g>
    <ellipse cx="54" cy="44" rx="31" ry="15" fill="#fbfbff" stroke="${K}" stroke-width="2"/>
    <path d="M70 36c4-10 9-18 16-24l12 6c-4 8-7 18-12 28z" fill="#fbfbff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>
    <g class="sch-head">
      <path d="M86 9c6-3 14-1 20 6 4 4 6 9 4 12-2 3-7 3-12 1-4-2-9-4-13-8z" fill="#fbfbff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M88 9l2-8 5 7z" fill="#fbfbff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="97" cy="15" r="1.8" fill="${K}"/>
      <circle cx="96" cy="15" r="4.2" fill="none" stroke="${K}" stroke-width="1.3"/>
      <path d="M100 15h3" stroke="${K}" stroke-width="1.3"/>
      <circle cx="107" cy="23" r="1.1" fill="${K}"/>
      <path d="M85 9c3-3 9-5 13-3l-2 3c-4 0-8 1-11 3z" fill="#2f3b52" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M95 5.5l5 1.2" stroke="#e9c46a" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <path d="M85 11c-4 4-7 6-9 10 3 0 3 2 1 4 2 1 2 3 0 5 2 1 2 3-1 5" fill="none" stroke="#c9c9d6" stroke-width="3" stroke-linecap="round"/>
    <g class="sch-leg sch-leg-b2"><path d="M40 50l-2 26h7l2-26z" fill="#fbfbff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M37.5 74h8v5h-8z" fill="#5b4636" stroke="${K}" stroke-width="2"/></g>
    <g class="sch-leg sch-leg-f2"><path d="M66 50l-2 26h7l2-26z" fill="#fbfbff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M63.5 74h8v5h-8z" fill="#5b4636" stroke="${K}" stroke-width="2"/></g>
    <path d="M44 34h14v14H44z" fill="#b3261e" stroke="${K}" stroke-width="1.6" transform="rotate(-8 51 41)" opacity=".9"/>
    <text x="51" y="45" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-weight="700" fill="#fbf6e9" transform="rotate(-8 51 41)">§</text>
  `, '0 0 116 84');

  // Kopf des Schimmels für Tipps
  I.schimmelKopf = svg(`
    <path d="M8 46c2-14 8-24 18-30l14 6c-4 10-6 20-10 28z" fill="#fbfbff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M24 13c7-4 17-2 24 6 5 5 7 11 4 14-3 3-9 3-15 1-5-2-11-5-15-10z" fill="#fbfbff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M26 13l2-9 6 8z" fill="#fbfbff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="37" cy="20" r="2.1" fill="${K}"/><circle cx="36" cy="20" r="5" fill="none" stroke="${K}" stroke-width="1.4"/><path d="M41 20h4" stroke="${K}" stroke-width="1.4"/>
    <circle cx="49" cy="29" r="1.3" fill="${K}"/><path d="M42 33c3 1 6 1 8-1" fill="none" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M22 14c4-4 11-6 16-4l-2 4c-5 0-10 1-13 3z" fill="#2f3b52" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M33 9.5l6 1.5" stroke="#e9c46a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M23 16c-5 5-8 8-11 13 3 0 3 3 1 5 2 1 2 4-1 6" fill="none" stroke="#c9c9d6" stroke-width="3.4" stroke-linecap="round"/>
  `, '0 0 60 52');

  AS.ICON = (name) => I[name] || I.akte;
  AS.ICONS = I;
})(typeof window !== 'undefined' ? window : globalThis);

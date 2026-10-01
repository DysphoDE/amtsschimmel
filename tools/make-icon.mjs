// Erzeugt icon.svg (und eine Vorlage für das maskierbare Symbol) aus dem Schimmelkopf in js/icons.js.
// Aufruf: node tools/make-icon.mjs  – die PNG-Fassungen erzeugt tools/icons.html im Browser.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
require(path.join(root, 'js', 'icons.js'));
const head = globalThis.AS.ICONS.schimmelKopf.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

function icon(pad) {
  const s = 512, inner = s - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${pad ? 0 : 96}" fill="#3a2b20"/>
  <g transform="translate(${pad} ${pad}) scale(${inner / 512})">
    <rect x="86" y="70" width="340" height="380" rx="10" fill="#fbf6e9" transform="rotate(-6 256 260)"/>
    <g fill="none" stroke="#b3261e" stroke-width="14" opacity=".9"><circle cx="256" cy="262" r="168"/><circle cx="256" cy="262" r="140" stroke-width="6"/></g>
    <g transform="translate(118 148) scale(4.6)">${head}</g>
    <rect x="96" y="408" width="320" height="22" rx="11" fill="#b3261e" opacity=".85" transform="rotate(-6 256 419)"/>
  </g>
</svg>`;
}
fs.writeFileSync(path.join(root, 'icon.svg'), icon(0));
fs.writeFileSync(path.join(root, 'tools', 'icon-maskable.svg'), icon(64));
console.log('icon.svg und tools/icon-maskable.svg geschrieben');

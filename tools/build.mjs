// Baut dist/amtsschimmel.html (eine Datei, per Doppelklick spielbar) und dist/artifact.html (Fragment ohne Gerüst),
// setzt die Cache-Version im Service Worker auf eine Prüfsumme aller Dateien und hängt diese Kennung
// an Skripte und Stylesheet in index.html, damit Browser-Caches nie alte und neue Dateien mischen.
// Aufruf: node tools/build.mjs
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const root = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('index.html');
const plainHtml = html.replace(/\?v=[0-9a-f]+/g, '');

const css = read('css/style.css');
const scripts = [...plainHtml.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((s) => '/* ---- ' + s + ' ---- */\n' + read(s)).join('\n').replace(/<\/script/gi, '<\\/script');
const iconData = 'data:image/svg+xml;base64,' + Buffer.from(read('icon.svg')).toString('base64');

const single = plainHtml
  .replace('<link rel="stylesheet" href="css/style.css">', () => '<style>\n' + css + '\n</style>')
  .replace(/(<script src="js\/[^"]+"><\/script>\s*)+/, () => '<script>\n' + js + '\n</script>\n')
  .replace('<link rel="manifest" href="manifest.webmanifest">\n', '')
  .replace('<link rel="icon" href="icon.svg" type="image/svg+xml">', '<link rel="icon" href="' + iconData + '" type="image/svg+xml">')
  .replace('<link rel="apple-touch-icon" href="icon-192.png">\n', '');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'amtsschimmel.html'), single);

// Fragment für eine Veröffentlichung als Artifact: Stil + Körper + Skript, ohne <html>/<head>/<body>
const body = plainHtml.split('<!--BODY-START-->')[1].split('<!--CONTENT-END-->')[0];
const artifact = '<title>Amtsschimmel</title>\n<style>\n' + css + '\n</style>\n' + body.trim() + '\n<script>\n' + js + '\n</script>\n';
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), artifact);

// Version: Prüfsumme über alle Dateien (index.html ohne die Kennungen selbst)
const assets = ['css/style.css', ...scripts, 'manifest.webmanifest', 'icon.svg'];
const hash = crypto.createHash('sha256');
hash.update(plainHtml);
for (const a of assets) hash.update(read(a));
const ver = 'amtsschimmel-' + hash.digest('hex').slice(0, 10);
const tag = ver.slice(-10);

const swPath = path.join(root, 'sw.js');
fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replace(/const VERSION = '[^']*';/, "const VERSION = '" + ver + "';"));
const tagged = plainHtml
  .replace(/(<script src="js\/[^"]+)("><\/script>)/g, '$1?v=' + tag + '$2')
  .replace('<link rel="stylesheet" href="css/style.css">', '<link rel="stylesheet" href="css/style.css?v=' + tag + '">');
fs.writeFileSync(path.join(root, 'index.html'), tagged);

const kb = (s) => Math.round(Buffer.byteLength(s) / 1024) + ' KB';
console.log('dist/amtsschimmel.html', kb(single));
console.log('dist/artifact.html    ', kb(artifact));
console.log('Version               ', ver);

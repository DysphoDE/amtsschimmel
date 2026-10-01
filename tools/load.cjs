// Lädt die DOM-freien Spieldateien in Node (für Simulation und Tests).
const path = require('path');
const root = path.join(__dirname, '..', 'js');
const FILES = ['util.js', 'data.js', 'systems.js', 'content.js', 'achievements.js', 'core.js'];
module.exports = function load() {
  for (const f of FILES) {
    const p = path.join(root, f);
    delete require.cache[require.resolve(p)];
    require(p);
  }
  return globalThis.AS;
};
module.exports.FILES = FILES;

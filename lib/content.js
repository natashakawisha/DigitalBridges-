// ===== Content Store =====
// Backs the raw-HTML CMS. User edits live in db.json under `content`
// (content.blocks, content.modules). Untouched values fall back to the
// seeded defaults in data/content-defaults.js so the site renders the same
// until something is edited, and "Reset to default" always works.

const fs = require('fs');
const path = require('path');

module.exports = function createContent(opts) {
  const { loadDB, saveDB, dbPath } = opts;
  const defaultsPath = path.join(__dirname, '..', 'data', 'content-defaults.js');
  const backupDir = path.join(__dirname, '..', 'data', 'backups');

  let DEFAULTS = null;
  function defaults() {
    if (!DEFAULTS) {
      delete require.cache[require.resolve(defaultsPath)];
      DEFAULTS = require(defaultsPath);
    }
    return DEFAULTS;
  }

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  // ----- Backups -----
  function backupDB() {
    try {
      if (!fs.existsSync(dbPath)) return null;
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const dest = path.join(backupDir, 'db-' + ts + '.json');
      fs.copyFileSync(dbPath, dest);
      // prune to last 20
      const files = fs.readdirSync(backupDir).filter(f => /^db-.*\.json$/.test(f)).sort();
      while (files.length > 20) { const old = files.shift(); try { fs.unlinkSync(path.join(backupDir, old)); } catch {} }
      return dest;
    } catch (e) {
      console.error('[content] backup failed:', e.message);
      return null;
    }
  }

  // ----- Content bootstrap -----
  function withContent(db) {
    if (!db.content || typeof db.content !== 'object') db.content = {};
    if (!db.content.blocks || typeof db.content.blocks !== 'object') db.content.blocks = {};
    if (!Array.isArray(db.content.modules) || db.content.modules.length === 0) {
      db.content.modules = clone(defaults().moduleDefaults || []);
    }
    return db;
  }

  // Read (persists the seed the first time so module CRUD has a base)
  function readContent() {
    const raw = loadDB();
    const needsSeed = !raw.content || !Array.isArray(raw.content.modules) || raw.content.modules.length === 0;
    const db = withContent(raw);
    if (needsSeed) saveDB(db);
    return db;
  }

  // ----- Pages / blocks -----
  function getPages() { return defaults().pages || []; }

  function getBlock(key) {
    const db = readContent();
    if (Object.prototype.hasOwnProperty.call(db.content.blocks, key)) return db.content.blocks[key];
    const d = defaults().blockDefaults || {};
    return Object.prototype.hasOwnProperty.call(d, key) ? d[key] : '';
  }

  function isBlockCustom(key) {
    const db = readContent();
    return Object.prototype.hasOwnProperty.call(db.content.blocks, key);
  }

  function getBlockDefault(key) {
    const d = defaults().blockDefaults || {};
    return Object.prototype.hasOwnProperty.call(d, key) ? d[key] : '';
  }

  function setBlock(key, html) {
    const db = readContent();
    backupDB();
    db.content.blocks[key] = html;
    saveDB(db);
  }

  function resetBlock(key) {
    const db = readContent();
    backupDB();
    delete db.content.blocks[key];
    saveDB(db);
  }

  // Inject every <!--BLOCK:key--> token in an HTML string.
  function injectBlocks(html) {
    const db = readContent();
    const d = defaults().blockDefaults || {};
    return html.replace(/<!--BLOCK:([a-zA-Z0-9_\/-]+)-->/g, (m, key) => {
      if (Object.prototype.hasOwnProperty.call(db.content.blocks, key)) return db.content.blocks[key];
      if (Object.prototype.hasOwnProperty.call(d, key)) return d[key];
      return '';
    });
  }

  // ----- Modules -----
  function getModules() { return readContent().content.modules; }

  function getModule(id) {
    const n = Number(id);
    return getModules().find(m => Number(m.id) === n) || null;
  }

  function nextModuleId() {
    const mods = getModules();
    return mods.reduce((mx, m) => Math.max(mx, Number(m.id) || 0), 0) + 1;
  }

  function saveModule(mod) {
    const db = readContent();
    backupDB();
    const n = Number(mod.id);
    const i = db.content.modules.findIndex(m => Number(m.id) === n);
    if (i === -1) db.content.modules.push(mod);
    else db.content.modules[i] = mod;
    db.content.modules.sort((a, b) => Number(a.id) - Number(b.id));
    saveDB(db);
  }

  function deleteModule(id) {
    const db = readContent();
    backupDB();
    const n = Number(id);
    db.content.modules = db.content.modules.filter(m => Number(m.id) !== n);
    saveDB(db);
  }

  return {
    backupDB,
    getPages, getBlock, isBlockCustom, getBlockDefault, setBlock, resetBlock, injectBlocks,
    getModules, getModule, nextModuleId, saveModule, deleteModule
  };
};

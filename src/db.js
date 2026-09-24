// ===== Database Layer (JSON file-based) =====
// Single place that owns the data-file location and its load/save helpers.
// Moved verbatim from server.js; only the relative path depth changed
// (this file lives in src/, so the data dir is one level up).
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function ensureDataDir() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], progress: [] }, null, 2));
  }
}

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { users: [], progress: [] }; }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Preserve the original behavior: ensure the data file exists on startup.
ensureDataDir();

module.exports = { DB_PATH, ensureDataDir, loadDB, saveDB };

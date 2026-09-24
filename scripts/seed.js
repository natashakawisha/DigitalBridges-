#!/usr/bin/env node
// ===== Database seed =====
// Creates data/db.json from the committed data/db.seed.json placeholder.
// data/db.json holds real user records and is git-ignored, so a fresh clone
// starts empty — run this to bootstrap a working local database.
//
// Usage:
//   node scripts/seed.js           create db.json only if it does not exist
//   node scripts/seed.js --force   overwrite an existing db.json
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const seedPath = path.join(dataDir, 'db.seed.json');
const dbPath = path.join(dataDir, 'db.json');

if (!fs.existsSync(seedPath)) {
  console.error('Seed file not found: ' + seedPath);
  process.exit(1);
}

if (fs.existsSync(dbPath) && !process.argv.includes('--force')) {
  console.error('data/db.json already exists. Re-run with --force to overwrite it.');
  process.exit(1);
}

fs.mkdirSync(dataDir, { recursive: true });
fs.copyFileSync(seedPath, dbPath);
console.log('Seeded data/db.json from data/db.seed.json');

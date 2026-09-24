#!/usr/bin/env node
// ===== Password hash helper =====
// Prints a bcrypt hash you can use as ADMIN_PASSWORD_HASH.
//
// Usage:
//   node scripts/hash-password.js "your-new-password"
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "your-new-password"');
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 10));

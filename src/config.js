// ===== Configuration =====
// Loads environment variables from .env (git-ignored) and exposes them with
// safe DUMMY defaults so the committed code never contains real credentials.
// Copy .env.example to .env and fill in real values for local development or
// set them in your hosting environment for production.
require('dotenv').config();

module.exports = {
  // Server port.
  PORT: Number(process.env.PORT) || 3000,

  // Session signing key. Dev-only dummy; set SESSION_SECRET in .env for real use.
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me',

  // Admin CMS login (served at /admin). Dev-only dummies; set in .env for real use.
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
  // bcrypt hash of the dev-only dummy admin password ("admin123").
  // Generate a real one with: node scripts/hash-password.js "your-password"
  ADMIN_PASSWORD_HASH:
    process.env.ADMIN_PASSWORD_HASH ||
    '$2a$10$YZb7n/vkVqHVP0VMxJ/lEuWfKvB/mX.0R6OtAqTTIvDM/duq.obtm',

  // Contact-form email notifications (Gmail). Dev-only dummies; set in .env.
  EMAIL_USER: process.env.EMAIL_USER || 'you@example.com',
  EMAIL_PASS: process.env.EMAIL_PASS || 'YOUR_APP_PASSWORD_HERE'
};

# Digital Bridges Zambia

A Node.js + Express website with a JSON-file database and a small server-rendered
CMS (admin at `/admin`). No build step — plain HTML/CSS/JS served from `public/`
and `views/`.

## Requirements

- Node.js 18+ (developed on Node 24)
- npm

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local database from the committed seed (safe placeholder records):

   ```bash
   node scripts/seed.js
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open http://localhost:3000

## Project structure

```
server.js            app entry point — builds the app and starts it
src/
  config.js          configuration placeholder (wired up in a later module)
  db.js              JSON database: data-file location + load/save helpers
  admin.js           server-rendered CMS router (mounted at /admin)
  middleware/
    auth.js          requireAuth session guard
  routes/
    user.js          register, login, logout, profile, progress
    contact.js       contact form intake + email notification
    content.js       dynamic /js/modules-data.js from the CMS store
  services/
    mailer.js        nodemailer transporter setup
    content.js       raw-HTML CMS content store
views/               HTML pages
public/
  css/  js/  assets/ static files
data/
  db.seed.json       committed starting data (fake/empty records)
  db.json            generated at runtime — git-ignored (real user records)
scripts/
  seed.js            create data/db.json from the seed
  hash-password.js   print a bcrypt hash for ADMIN_PASSWORD_HASH
docs/
  DOCUMENTATION.md   full project documentation
```

## Admin CMS

- URL: http://localhost:3000/admin
- The admin email and password hash are defined in `server.js`
  (`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`).
- Generate a new password hash with:

  ```bash
  node scripts/hash-password.js "your-new-password"
  ```

## Notes

- `data/db.json` contains real user records and is intentionally git-ignored; it
  is generated from `data/db.seed.json` via `node scripts/seed.js`.
- Moving credentials out of `server.js` into environment variables (`.env`) is
  scheduled for a later module. `.env.example` lists the intended keys with fake
  placeholder values.
- Full project documentation lives in `docs/DOCUMENTATION.md`.

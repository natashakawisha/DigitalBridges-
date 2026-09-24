const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const createMailer = require('./src/services/mailer');

const createAdminRouter = require('./src/admin');
const createContent = require('./src/services/content');
const createUserRouter = require('./src/routes/user');
const createContactRouter = require('./src/routes/contact');
const createContentRouter = require('./src/routes/content');

const app = express();
const PORT = 3000;

// ===== Email Configuration =====
// To get a Gmail App Password:
// 1. Go to https://myaccount.google.com/apppasswords
// 2. Sign in with your Google account (2FA must be enabled)
// 3. Generate a new App Password and paste it below
const EMAIL_USER = 'natashakawisha@gmail.com';
const EMAIL_PASS = 'lbcvqgixyffwauzl';

const transporter = createMailer(EMAIL_USER, EMAIL_PASS);

// ===== Admin CMS Configuration =====
// Hardcoded admin credentials for the CMS at /admin.
// To change the password, run:  node -e "console.log(require('bcryptjs').hashSync('YOUR_NEW_PASSWORD', 10))"
// and paste the resulting hash into ADMIN_PASSWORD_HASH below.
const ADMIN_EMAIL = 'admin@digitalbridges.zm';
const ADMIN_PASSWORD_HASH = '$2a$10$YZb7n/vkVqHVP0VMxJ/lEuWfKvB/mX.0R6OtAqTTIvDM/duq.obtm'; // default password: admin123

// ===== Database Layer (JSON file-based) =====
// Data-file location and load/save helpers live in src/db.js.
const { DB_PATH, loadDB, saveDB } = require('./src/db');

// ===== Content Store (raw-HTML CMS) =====
const content = createContent({ loadDB, saveDB, dbPath: DB_PATH });

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'digital-bridges-zambia-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Make user info available to all page requests
app.use((req, res, next) => {
  if (req.session.userId) {
    const db = loadDB();
    const user = db.users.find(u => u.id === req.session.userId);
    if (user) {
      res.locals.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    }
  }
  next();
});

// ===== Static Files =====
// Dynamic module data (served from the CMS content store) must be registered
// before the static /js handler so it shadows js/modules-data.js on disk.
app.use(createContentRouter({ content }));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// ===== Page Routes (serve HTML with auth context) =====
const pages = ['index', 'about', 'learning', 'module', 'faq', 'contact', 'login', 'register', 'dashboard'];

pages.forEach(page => {
  // index is served at both "/" and "/index.html"; other pages at "/<page>.html"
  const routes = page === 'index' ? ['/', '/index.html'] : [`/${page}.html`];
  app.get(routes, (req, res) => {
    const filePath = path.join(__dirname, 'views', `${page}.html`);
    fs.readFile(filePath, 'utf8', (err, html) => {
      if (err) { res.status(404).send('Page not found'); return; }

      // Inject auth state into the page
      const isLoggedIn = !!req.session.userId;
      let user = null;
      if (isLoggedIn) {
        const db = loadDB();
        user = db.users.find(u => u.id === req.session.userId);
      }

      // Replace auth placeholders in HTML
      if (user) {
        html = html.replace(/<!--AUTH_NAV-->/g,
          `<li><a href="dashboard.html">Dashboard</a></li>
           <li><a href="#" id="logoutBtn" class="nav-cta">Logout</a></li>`);
        html = html.replace(/<!--AUTH_NAV_MOBILE-->/g,
          `<li><a href="dashboard.html">Dashboard</a></li>
           <li><a href="#" id="logoutBtnMobile">Logout</a></li>`);
      } else {
        html = html.replace(/<!--AUTH_NAV-->/g,
          `<li class="nav-cta-item"><a href="login.html" class="nav-cta nav-cta-outline">Login</a></li>
           <li class="nav-cta-item"><a href="register.html" class="nav-cta nav-cta-accent">Sign Up</a></li>`);
        html = html.replace(/<!--AUTH_NAV_MOBILE-->/g,
          `<li><a href="login.html">Login</a></li>
           <li><a href="register.html">Sign Up</a></li>`);
      }

      // Inject user data script for dashboard
      if (user && page === 'dashboard') {
        const db = loadDB();
        const progress = db.progress.filter(p => p.userId === user.id);
        html = html.replace('</head>',
          `<script>window.__USER__=${JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role, joined: user.createdAt })};window.__PROGRESS__=${JSON.stringify(progress)};</script></head>`);
      }

      // Inject editable content blocks (<!--BLOCK:key-->) from the CMS
      html = content.injectBlocks(html);

      res.send(html);
    });
  });
});

// ===== API Routes =====
// User & auth endpoints (register, login, logout, profile, progress).
app.use('/api', createUserRouter({ loadDB, saveDB }));
// Contact form endpoint.
app.use('/api', createContactRouter({ loadDB, saveDB, transporter, EMAIL_USER, EMAIL_PASS }));

// ===== Download Documentation =====
app.get('/download/documentation', (req, res) => {
  const filePath = path.join(__dirname, 'docs', 'DOCUMENTATION.md');
  res.download(filePath, 'Digital_Bridges_Zambia_Documentation.md');
});

// ===== Admin CMS =====
app.use('/admin', createAdminRouter({
  loadDB,
  saveDB,
  transporter,
  ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH,
  EMAIL_USER,
  content
}));

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`\n  Digital Bridges Zambia Server`);
  console.log(`  Running at http://localhost:${PORT}`);
  console.log(`  Download docs: http://localhost:${PORT}/download/documentation`);
  console.log(`  Admin CMS:     http://localhost:${PORT}/admin  (${ADMIN_EMAIL} / admin123)\n`);
});

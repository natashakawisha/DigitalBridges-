const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const createMailer = require('./src/services/mailer');

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

const createAdminRouter = require('./src/admin');
const createContent = require('./src/services/content');

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

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please login to continue.' });
  }
  next();
}

// ===== Static Files =====
// Dynamic module data (served from the CMS content store) must be registered
// before the static /js handler so it shadows js/modules-data.js on disk.
app.get('/js/modules-data.js', (req, res) => {
  const mods = content.getModules();
  const json = JSON.stringify(mods).replace(/<\//g, '<\\/');
  res.type('application/javascript').send('window.MODULES_DATA = ' + json + ';');
});
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

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const db = loadDB();

    // Check if email already exists
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'learner',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDB(db);

    // Set session
    req.session.userId = newUser.id;

    res.json({
      success: true,
      message: 'Registration successful!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    const db = loadDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Set session
    req.session.userId = user.id;

    res.json({
      success: true,
      message: 'Login successful!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed.' });
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// Get current user
app.get('/api/user', requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.session.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, joined: user.createdAt }
  });
});

// Update profile
app.put('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const db = loadDB();
    const userIndex = db.users.findIndex(u => u.id === req.session.userId);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = db.users[userIndex];

    // Update name
    if (name && name.trim().length >= 2) {
      user.name = name.trim();
    }

    // Update email
    if (email && email.includes('@')) {
      const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.id !== user.id);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email is already in use.' });
      }
      user.email = email.toLowerCase().trim();
    }

    // Update password
    if (newPassword && newPassword.length >= 6) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    db.users[userIndex] = user;
    saveDB(db);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Get user progress
app.get('/api/user/progress', requireAuth, (req, res) => {
  const db = loadDB();
  const progress = db.progress.filter(p => p.userId === req.session.userId);
  res.json({ success: true, progress });
});

// Update module progress
app.post('/api/user/progress', requireAuth, (req, res) => {
  try {
    const { moduleId, status } = req.body; // moduleId: 1-8, status: 'not_started'|'in_progress'|'completed'

    if (!moduleId || moduleId < 1 || moduleId > 8) {
      return res.status(400).json({ success: false, message: 'Invalid module ID.' });
    }

    const validStatuses = ['not_started', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const db = loadDB();
    const existingIndex = db.progress.findIndex(p => p.userId === req.session.userId && p.moduleId === moduleId);

    if (existingIndex >= 0) {
      db.progress[existingIndex].status = status;
      db.progress[existingIndex].updatedAt = new Date().toISOString();
    } else {
      db.progress.push({
        userId: req.session.userId,
        moduleId,
        status,
        updatedAt: new Date().toISOString()
      });
    }

    saveDB(db);
    res.json({ success: true, message: 'Progress updated.' });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ===== Contact Form =====
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter your name.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email.' });
    }
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Please select a subject.' });
    }
    if (!message || message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters.' });
    }

    // Save to database
    const db = loadDB();
    if (!db.messages) db.messages = [];

    const newMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      email: email.trim(),
      subject,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    db.messages.push(newMessage);
    saveDB(db);

    // Send email notification
    if (EMAIL_PASS && EMAIL_PASS !== 'YOUR_APP_PASSWORD_HERE') {
      try {
        await transporter.sendMail({
          from: `"Digital Bridges Zambia" <${EMAIL_USER}>`,
          to: EMAIL_USER,
          replyTo: email,
          subject: `[Contact Form] ${subject} - from ${name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <table style="border-collapse:collapse;width:100%;max-width:600px;">
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #ddd;">Name</td><td style="padding:8px;border-bottom:1px solid #ddd;">${name}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #ddd;">Email</td><td style="padding:8px;border-bottom:1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #ddd;">Subject</td><td style="padding:8px;border-bottom:1px solid #ddd;">${subject}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #ddd;">Message</td><td style="padding:8px;border-bottom:1px solid #ddd;">${message.replace(/\n/g, '<br>')}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:20px;">Sent from Digital Bridges Zambia contact form.</p>
          `
        });
        console.log(`Email sent: ${subject} from ${name} (${email})`);
      } catch (emailErr) {
        console.error('Email send error:', emailErr.message);
      }
    } else {
      console.log(`Message saved (email not configured): ${subject} from ${name} (${email})`);
    }

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

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

// ===== Admin CMS Router =====
// Server-rendered multi-page admin for managing contact form messages.
// Mounted from server.js at /admin.

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = function createAdminRouter(opts) {
  const { loadDB, saveDB, transporter, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, EMAIL_USER } = opts;
  const router = express.Router();

  // ----- Login rate limiting -----
  // After MAX_LOGIN_ATTEMPTS failed logins from the same IP, block for LOCKOUT_MINUTES.
  // State is in-memory only; a server restart clears it.
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_MINUTES = 15;
  const WARN_AFTER = 3; // show "N attempts remaining" warning from this failure count
  const loginAttempts = new Map(); // ip -> { count, blockedUntil }

  function getClientIp(req) {
    const xf = req.headers['x-forwarded-for'];
    if (xf) return String(xf).split(',')[0].trim();
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  function pruneExpired() {
    const now = Date.now();
    for (const [ip, state] of loginAttempts) {
      if (state.blockedUntil && state.blockedUntil <= now) loginAttempts.delete(ip);
      else if (!state.blockedUntil && state.count === 0) loginAttempts.delete(ip);
    }
  }
  setInterval(pruneExpired, 10 * 60 * 1000).unref();

  function getLoginState(ip) {
    const state = loginAttempts.get(ip);
    if (!state) return { blocked: false, count: 0, retryAfterSec: 0, remaining: MAX_LOGIN_ATTEMPTS };
    const now = Date.now();
    if (state.blockedUntil && state.blockedUntil > now) {
      return { blocked: true, count: state.count, retryAfterSec: Math.ceil((state.blockedUntil - now) / 1000), remaining: 0 };
    }
    if (state.blockedUntil && state.blockedUntil <= now) {
      loginAttempts.delete(ip);
      return { blocked: false, count: 0, retryAfterSec: 0, remaining: MAX_LOGIN_ATTEMPTS };
    }
    return { blocked: false, count: state.count, retryAfterSec: 0, remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - state.count) };
  }

  function recordLoginFailure(ip) {
    const state = loginAttempts.get(ip) || { count: 0 };
    state.count += 1;
    if (state.count >= MAX_LOGIN_ATTEMPTS) {
      state.blockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
    }
    loginAttempts.set(ip, state);
    return getLoginState(ip);
  }

  function resetLoginAttempts(ip) {
    loginAttempts.delete(ip);
  }

  // ----- Helpers -----
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function ensureCsrf(req) {
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    return req.session.csrfToken;
  }

  function verifyCsrf(req, res, next) {
    const token = (req.body && req.body._csrf) || req.query._csrf;
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).send(layout('Forbidden', '<div class="admin-container"><div class="alert alert-error">Invalid or expired CSRF token. <a href="/admin/messages" style="text-decoration:underline;">Go back</a></div></div>'));
    }
    next();
  }

  function flash(req, type, message) {
    req.session.flash = { type, message };
  }
  function takeFlash(req) {
    const f = req.session.flash;
    delete req.session.flash;
    return f;
  }

  function requireAdmin(req, res, next) {
    if (!req.session.isAdmin) return res.redirect('/admin/login');
    next();
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function truncate(s, n) {
    if (!s) return '';
    s = s.replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n) + '\u2026' : s;
  }

  // ----- Icons (inline SVG) -----
  const ICONS = {
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    reply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
  };

  // ----- Layout -----
  function layout(title, body, opts2 = {}) {
    const { activeNav = '', isAdmin = false, csrf = '' } = opts2;
    const topbar = isAdmin ? `
      <header class="admin-topbar">
        <a href="/admin/messages" class="brand">
          <span class="logo-icon" style="width:32px;height:32px;background:rgba(255,255,255,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;">${ICONS.logo}</span>
          <span>Digital Bridges<span class="sub">Admin CMS</span></span>
        </a>
        <nav>
          <a href="/admin/messages" class="${activeNav === 'messages' ? 'active' : ''}">Messages</a>
          <a href="/" target="_blank" rel="noopener">View site</a>
          <form method="POST" action="/admin/logout" style="display:inline;">
            <input type="hidden" name="_csrf" value="${esc(csrf)}">
            <button type="submit" class="logout-btn">Logout</button>
          </form>
        </nav>
      </header>` : '';
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} &middot; Digital Bridges Admin</title>
<link rel="stylesheet" href="/CSS/style.css">
<link rel="stylesheet" href="/CSS/admin.css">
</head>
<body class="admin-body">
${topbar}
${body}
</body>
</html>`;
  }

  function alertBlock(f) {
    if (!f) return '';
    const icon = f.type === 'success' ? ICONS.success : f.type === 'error' ? ICONS.alert : ICONS.alert;
    return `<div class="alert alert-${esc(f.type)}">${icon}<span>${esc(f.message)}</span></div>`;
  }

  // ----- Login page -----
  function loginPage(csrf, error, opts2 = {}) {
    const { notice, blocked } = opts2;
    const disabled = blocked ? 'disabled' : '';
    const retryText = blocked
      ? `Too many failed attempts. Try again in <strong>${Math.max(1, Math.ceil(blocked.retryAfterSec / 60))}</strong> minute${Math.ceil(blocked.retryAfterSec / 60) === 1 ? '' : 's'}.`
      : '';
    return `
      <div class="login-wrap">
        <div class="login-card">
          <div class="logo"><div class="logo-icon">${ICONS.logo}</div></div>
          <h1>Admin Login</h1>
          <p class="subtitle">Digital Bridges Zambia CMS</p>
          ${blocked ? `<div class="alert alert-error">${ICONS.alert}<span>${retryText}</span></div>` : ''}
          ${!blocked && error ? `<div class="alert alert-error">${ICONS.alert}<span>${esc(error)}</span></div>` : ''}
          ${!blocked && notice ? `<div class="alert alert-info">${ICONS.alert}<span>${esc(notice)}</span></div>` : ''}
          <form method="POST" action="/admin/login" class="admin-form">
            <input type="hidden" name="_csrf" value="${esc(csrf)}">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="username" ${blocked ? '' : 'autofocus'} ${disabled}>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="current-password" ${disabled}>
            <div class="form-actions">
              <button type="submit" class="admin-btn admin-btn-primary" style="flex:1;justify-content:center;" ${disabled}>${blocked ? 'Locked' : 'Sign in'}</button>
              <a href="/" class="admin-btn admin-btn-outline">Back to site</a>
            </div>
          </form>
        </div>
      </div>`;
  }

  // ----- Messages list -----
  function messagesPage(messages, filter, counts, csrf, flashMsg) {
    const rows = messages.length === 0
      ? `<tr><td colspan="5"><div class="admin-empty">${ICONS.inbox}<h3>No messages here</h3><p>Nothing matches the current filter.</p></div></td></tr>`
      : messages.map(m => {
        const status = m.repliedAt ? 'replied' : (m.read ? 'read' : 'new');
        const badge = status === 'replied'
          ? '<span class="badge badge-replied">Replied</span>'
          : status === 'read'
            ? '<span class="badge badge-read">Read</span>'
            : '<span class="badge badge-new">New</span>';
        return `<tr class="${m.read ? '' : 'unread'}">
          <td data-label="From"><strong>${esc(m.name)}</strong><div class="meta">${esc(m.email)}</div></td>
          <td data-label="Subject" class="subject"><a href="/admin/messages/${esc(m.id)}">${esc(m.subject)}</a></td>
          <td data-label="Preview" class="preview">${esc(truncate(m.message, 90))}</td>
          <td data-label="Received" class="meta">${esc(fmtDate(m.createdAt))}</td>
          <td data-label="Status">${badge}</td>
        </tr>`;
      }).join('');

    const filterLink = (key, label, count) =>
      `<a href="/admin/messages?filter=${key}" class="${filter === key ? 'active' : ''}">${label}<span class="count">${count}</span></a>`;

    return `
      <div class="admin-container">
        ${alertBlock(flashMsg)}
        <div class="admin-page-header">
          <div>
            <h1>Contact Messages</h1>
            <p>Submissions from the site contact form.</p>
          </div>
        </div>
        <div class="admin-stats">
          <div class="admin-stat"><div class="icon-wrap">${ICONS.inbox}</div><div><div class="value">${counts.total}</div><div class="label">Total</div></div></div>
          <div class="admin-stat"><div class="icon-wrap">${ICONS.mail}</div><div><div class="value">${counts.unread}</div><div class="label">Unread</div></div></div>
          <div class="admin-stat accent"><div class="icon-wrap">${ICONS.reply}</div><div><div class="value">${counts.replied}</div><div class="label">Replied</div></div></div>
        </div>
        <div class="admin-filters">
          ${filterLink('all', 'All', counts.total)}
          ${filterLink('unread', 'Unread', counts.unread)}
          ${filterLink('read', 'Read', counts.read)}
          ${filterLink('replied', 'Replied', counts.replied)}
        </div>
        <table class="admin-table">
          <thead><tr><th>From</th><th>Subject</th><th>Preview</th><th>Received</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // ----- Message detail -----
  function messageDetailPage(m, csrf, flashMsg) {
    const status = m.repliedAt ? 'replied' : (m.read ? 'read' : 'new');
    const badge = status === 'replied'
      ? '<span class="badge badge-replied">Replied</span>'
      : status === 'read'
        ? '<span class="badge badge-read">Read</span>'
        : '<span class="badge badge-new">New</span>';
    return `
      <div class="admin-container">
        ${alertBlock(flashMsg)}
        <a href="/admin/messages" class="back-link">${ICONS.back}<span>All messages</span></a>
        <div class="admin-card">
          <div class="msg-header">
            <div>
              <h2>${esc(m.subject)} ${badge}</h2>
              <div class="meta" style="color:var(--text-muted);font-size:0.88rem;">Received ${esc(fmtDate(m.createdAt))}${m.repliedAt ? ' &middot; Replied ' + esc(fmtDate(m.repliedAt)) : ''}</div>
            </div>
            <div class="action-row">
              <form method="POST" action="/admin/messages/${esc(m.id)}/read">
                <input type="hidden" name="_csrf" value="${esc(csrf)}">
                <button type="submit" class="admin-btn admin-btn-outline admin-btn-sm">${ICONS.eye}<span>${m.read ? 'Mark unread' : 'Mark read'}</span></button>
              </form>
              <form method="POST" action="/admin/messages/${esc(m.id)}/delete" onsubmit="return confirm('Delete this message permanently?');">
                <input type="hidden" name="_csrf" value="${esc(csrf)}">
                <button type="submit" class="admin-btn admin-btn-danger admin-btn-sm">${ICONS.trash}<span>Delete</span></button>
              </form>
            </div>
          </div>
          <div class="msg-meta">
            <div><strong>From</strong>${esc(m.name)}</div>
            <div><strong>Email</strong><a href="mailto:${esc(m.email)}" style="color:var(--primary);">${esc(m.email)}</a></div>
            <div><strong>Subject</strong>${esc(m.subject)}</div>
            <div><strong>Received</strong>${esc(fmtDate(m.createdAt))}</div>
          </div>
          <div class="msg-body">${esc(m.message)}</div>
        </div>

        <div class="admin-card">
          <h2 style="font-size:1.15rem;color:var(--primary-dark);margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">${ICONS.reply}<span>Reply to ${esc(m.name)}</span></h2>
          <form method="POST" action="/admin/messages/${esc(m.id)}/reply" class="admin-form">
            <input type="hidden" name="_csrf" value="${esc(csrf)}">
            <label for="replySubject">Subject</label>
            <input type="text" id="replySubject" name="subject" value="Re: ${esc(m.subject)}" required>
            <label for="replyBody">Message</label>
            <textarea id="replyBody" name="body" required placeholder="Write your reply\u2026"></textarea>
            <div class="form-actions">
              <button type="submit" class="admin-btn admin-btn-primary">${ICONS.reply}<span>Send reply</span></button>
              <span style="font-size:0.82rem;color:var(--text-muted);align-self:center;">Sent from ${esc(EMAIL_USER || ADMIN_EMAIL)}</span>
            </div>
          </form>
        </div>
      </div>`;
  }

  // ----- Routes -----

  router.get('/', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/admin/login');
    res.redirect('/admin/messages');
  });

  router.get('/login', (req, res) => {
    if (req.session.isAdmin) return res.redirect('/admin/messages');
    const csrf = ensureCsrf(req);
    const ip = getClientIp(req);
    const state = getLoginState(ip);
    if (state.blocked) {
      return res.status(429).send(layout('Login', loginPage(csrf, null, { blocked: state }), { csrf }));
    }
    const notice = state.count >= WARN_AFTER
      ? `${state.remaining} login attempt${state.remaining === 1 ? '' : 's'} remaining before a ${LOCKOUT_MINUTES}-minute lockout.`
      : null;
    res.send(layout('Login', loginPage(csrf, null, { notice }), { csrf }));
  });

  router.post('/login', verifyCsrf, async (req, res) => {
    const csrf = ensureCsrf(req);
    const ip = getClientIp(req);

    // Block check first — reject before doing any credential work
    const preState = getLoginState(ip);
    if (preState.blocked) {
      return res.status(429).send(layout('Login', loginPage(csrf, null, { blocked: preState }), { csrf }));
    }

    const { email, password } = req.body;
    if (!email || !password) {
      const st = recordLoginFailure(ip);
      const notice = st.count >= WARN_AFTER && !st.blocked ? `${st.remaining} attempt${st.remaining === 1 ? '' : 's'} remaining.` : null;
      return res.status(400).send(layout('Login', loginPage(csrf, 'Email and password are required.', { notice, blocked: st.blocked ? st : null }), { csrf }));
    }

    const emailOk = email.trim().toLowerCase() === String(ADMIN_EMAIL).toLowerCase();
    let passOk = false;
    if (emailOk) {
      try { passOk = await bcrypt.compare(password, ADMIN_PASSWORD_HASH); }
      catch { passOk = false; }
    }

    if (!emailOk || !passOk) {
      const st = recordLoginFailure(ip);
      console.warn(`[admin] Failed login from ${ip} (attempt ${st.count}/${MAX_LOGIN_ATTEMPTS})`);
      if (st.blocked) {
        return res.status(429).send(layout('Login', loginPage(csrf, null, { blocked: st }), { csrf }));
      }
      const notice = st.count >= WARN_AFTER
        ? `${st.remaining} attempt${st.remaining === 1 ? '' : 's'} remaining before a ${LOCKOUT_MINUTES}-minute lockout.`
        : null;
      return res.status(401).send(layout('Login', loginPage(csrf, 'Invalid email or password.', { notice }), { csrf }));
    }

    // Success — clear attempts and regenerate session
    resetLoginAttempts(ip);
    req.session.isAdmin = true;
    req.session.adminEmail = email.trim().toLowerCase();
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    res.redirect('/admin/messages');
  });

  router.post('/logout', verifyCsrf, (req, res) => {
    req.session.isAdmin = false;
    req.session.adminEmail = null;
    delete req.session.csrfToken;
    res.redirect('/admin/login');
  });

  router.get('/messages', requireAdmin, (req, res) => {
    const csrf = ensureCsrf(req);
    const db = loadDB();
    const all = (db.messages || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const counts = {
      total: all.length,
      unread: all.filter(m => !m.read && !m.repliedAt).length,
      read: all.filter(m => m.read).length,
      replied: all.filter(m => m.repliedAt).length
    };
    const rawFilter = req.query.filter || 'all';
    const filter = ['all', 'unread', 'read', 'replied'].includes(rawFilter) ? rawFilter : 'all';
    let list = all;
    if (filter === 'unread') list = all.filter(m => !m.read && !m.repliedAt);
    else if (filter === 'read') list = all.filter(m => m.read);
    else if (filter === 'replied') list = all.filter(m => m.repliedAt);
    res.send(layout('Messages', messagesPage(list, filter, counts, csrf, takeFlash(req)), { activeNav: 'messages', isAdmin: true, csrf }));
  });

  router.get('/messages/:id', requireAdmin, (req, res) => {
    const csrf = ensureCsrf(req);
    const db = loadDB();
    const messages = db.messages || [];
    const idx = messages.findIndex(m => m.id === req.params.id);
    if (idx === -1) {
      return res.status(404).send(layout('Not found', '<div class="admin-container"><div class="alert alert-error">Message not found. <a href="/admin/messages" style="text-decoration:underline;">Back to list</a></div></div>', { isAdmin: true, activeNav: 'messages', csrf }));
    }
    // Auto-mark as read on first view
    if (!messages[idx].read && !messages[idx].repliedAt) {
      messages[idx].read = true;
      db.messages = messages;
      saveDB(db);
    }
    res.send(layout('Message', messageDetailPage(messages[idx], csrf, takeFlash(req)), { isAdmin: true, activeNav: 'messages', csrf }));
  });

  router.post('/messages/:id/read', requireAdmin, verifyCsrf, (req, res) => {
    const db = loadDB();
    const messages = db.messages || [];
    const m = messages.find(x => x.id === req.params.id);
    if (!m) { flash(req, 'error', 'Message not found.'); return res.redirect('/admin/messages'); }
    m.read = !m.read;
    saveDB(db);
    flash(req, 'success', m.read ? 'Marked as read.' : 'Marked as unread.');
    res.redirect('/admin/messages/' + encodeURIComponent(m.id));
  });

  router.post('/messages/:id/delete', requireAdmin, verifyCsrf, (req, res) => {
    const db = loadDB();
    const before = (db.messages || []).length;
    db.messages = (db.messages || []).filter(x => x.id !== req.params.id);
    if (db.messages.length === before) {
      flash(req, 'error', 'Message not found.');
    } else {
      saveDB(db);
      flash(req, 'success', 'Message deleted.');
    }
    res.redirect('/admin/messages');
  });

  router.post('/messages/:id/reply', requireAdmin, verifyCsrf, async (req, res) => {
    const db = loadDB();
    const messages = db.messages || [];
    const m = messages.find(x => x.id === req.params.id);
    if (!m) { flash(req, 'error', 'Message not found.'); return res.redirect('/admin/messages'); }

    const subject = (req.body.subject || '').trim();
    const body = (req.body.body || '').trim();
    if (!subject || body.length < 2) {
      flash(req, 'error', 'Reply subject and message are required.');
      return res.redirect('/admin/messages/' + encodeURIComponent(m.id));
    }

    try {
      await transporter.sendMail({
        from: `"Digital Bridges Zambia" <${EMAIL_USER || ADMIN_EMAIL}>`,
        to: m.email,
        replyTo: EMAIL_USER || ADMIN_EMAIL,
        subject,
        text: body,
        html: `<div style="font-family:Segoe UI,system-ui,sans-serif;max-width:640px;color:#0f172a;line-height:1.7;">
          <p>Hi ${esc(m.name)},</p>
          <p style="white-space:pre-wrap;">${esc(body)}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
          <p style="color:#64748b;font-size:12px;">Digital Bridges Zambia<br>In reply to your message &ldquo;${esc(m.subject)}&rdquo; sent ${esc(fmtDate(m.createdAt))}.</p>
        </div>`
      });
      m.repliedAt = new Date().toISOString();
      m.read = true;
      if (!Array.isArray(m.replies)) m.replies = [];
      m.replies.push({ subject, body, sentAt: m.repliedAt });
      saveDB(db);
      flash(req, 'success', 'Reply sent to ' + m.email + '.');
    } catch (err) {
      console.error('Admin reply error:', err);
      flash(req, 'error', 'Failed to send reply: ' + err.message);
    }
    res.redirect('/admin/messages/' + encodeURIComponent(m.id));
  });

  return router;
};

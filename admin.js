// ===== Admin CMS Router =====
// Server-rendered multi-page admin for managing contact form messages.
// Mounted from server.js at /admin.

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = function createAdminRouter(opts) {
  const { loadDB, saveDB, transporter, ADMIN_EMAIL, ADMIN_PASSWORD_HASH, EMAIL_USER, content } = opts;
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
          <a href="/admin/pages" class="${activeNav === 'pages' ? 'active' : ''}">Pages</a>
          <a href="/admin/modules" class="${activeNav === 'modules' ? 'active' : ''}">Modules</a>
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
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/admin.css">
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

  // ===== CMS: module markup helpers (mirror js/script.js structured render) =====
  const MICON = {
    device: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    computer: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
  };
  function mIcon(name, cls) {
    const inner = MICON[name] || MICON.check;
    return '<svg class="' + (cls || 'icon icon-sm') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  function mEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function defaultHomeCard(m) {
    return '<div class="module-number">' + mEsc(m.number) + '</div>' +
      '<h3>' + mEsc(m.title) + '</h3>' +
      '<p>' + mEsc(m.subtitle) + '</p>' +
      '<div class="module-topics">' + (m.topics || []).slice(0, 3).map(t => '<span>' + mEsc(t.label) + '</span>').join('') + '</div>';
  }
  function defaultListCard(m) {
    const topics = (m.topics || []).slice(0, 4).map(t =>
      '<span class="topic-chip"><span class="topic-icon">' + mIcon(t.icon) + '</span><span>' + mEsc(t.label) + '</span></span>').join('');
    return '<div class="module-list-top">' +
        '<div class="module-detail-number">' + mEsc(m.number) + '</div>' +
        '<div class="module-list-title"><h3>' + mEsc(m.title) + '</h3><p class="module-subtitle">' + mEsc(m.subtitle) + '</p></div>' +
      '</div>' +
      '<p class="module-list-desc">' + mEsc(m.description) + '</p>' +
      '<div class="module-topics-list static">' + topics + '</div>' +
      '<div class="module-list-foot">' +
        '<span class="module-meta-pill">' + mIcon('clock') + mEsc(m.duration) + '</span>' +
        '<span class="module-meta-pill">' + mEsc(m.level) + '</span>' +
        '<span class="module-open-link">Open module ' + mIcon('arrowRight') + '</span>' +
      '</div>';
  }
  function defaultBody(m) {
    const topics = (m.topics || []).map(t => '<div class="topic-chip"><span class="topic-icon">' + mIcon(t.icon) + '</span><span>' + mEsc(t.label) + '</span></div>').join('');
    const objectives = (m.objectives || []).map(o => '<li class="objective-row">' + mIcon('check', 'icon icon-sm obj-check') + '<span>' + mEsc(o) + '</span></li>').join('');
    const lessons = (m.lessons || []).map((l, i) => '<div class="lesson-item"><div class="lesson-num">' + (i + 1) + '</div><div><h4>' + mEsc(l.title) + '</h4><p>' + mEsc(l.summary) + '</p></div></div>').join('');
    return '<div class="module-body-block"><h2>About this module</h2><p>' + mEsc(m.description) + '</p></div>' +
      '<div class="module-body-block"><h2>What you will learn</h2><ul class="objectives-check">' + objectives + '</ul></div>' +
      '<div class="module-body-block"><h2>Topics covered</h2><div class="module-topics-list static">' + topics + '</div></div>' +
      '<div class="module-body-block"><h2>Lessons</h2><div class="lessons-list">' + lessons + '</div></div>' +
      '<div class="module-cta"><a href="login.html" class="btn btn-primary">Start this module</a>' +
        '<span>Sign in to track your progress and mark this module complete.</span></div>';
  }

  // Client-side helpers shared by the Pages and Modules editors: live preview
  // (sandboxed iframe using the site stylesheet) and "load current markup".
  function cmsEditorScript() {
    return `<script>
    (function () {
      function buildSrcdoc(kind, html) {
        var wrap = html;
        if (kind === 'home') wrap = '<div class="modules-grid"><a class="module-card home-module-card">' + html + '</a></div>';
        else if (kind === 'list') wrap = '<div class="module-list"><a class="module-list-card">' + html + '</a></div>';
        else if (kind === 'body') wrap = '<section class="section"><div class="section-inner" style="max-width:900px;">' + html + '</div></section>';
        return '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/css/style.css"><style>body{background:#fff;padding:1rem;}</style></head><body>' + wrap + '</body></html>';
      }
      document.querySelectorAll('.cms-preview-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var box = btn.closest('.cms-block');
          var ta = box.querySelector('textarea.cms-html');
          var frame = box.querySelector('iframe.cms-preview');
          if (!frame) return;
          if (!frame.hidden) { frame.hidden = true; btn.textContent = 'Preview'; return; }
          frame.srcdoc = buildSrcdoc(btn.getAttribute('data-preview') || 'block', ta.value);
          frame.hidden = false; btn.textContent = 'Hide preview';
        });
      });
      document.querySelectorAll('.cms-load-default').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slot = btn.getAttribute('data-slot');
          var src = document.querySelector('textarea.cms-default-src[data-slot="' + slot + '"]');
          var ta = document.querySelector('textarea.cms-html[data-slot="' + slot + '"]');
          if (src && ta) ta.value = src.value;
        });
      });
    })();
    </script>`;
  }

  // ----- Pages editor views -----
  function pagesPickerPage(pages, csrf, flashMsg) {
    const cards = pages.map(p => `
        <a class="cms-page-card" href="/admin/pages/${esc(p.id)}">
          <h3>${esc(p.label)}</h3>
          <p>${p.blocks.length} editable block${p.blocks.length === 1 ? '' : 's'}</p>
        </a>`).join('');
    return `
      <div class="admin-container">
        ${alertBlock(flashMsg)}
        <div class="admin-page-header">
          <div><h1>Pages</h1><p>Edit the raw HTML blocks that make up each page. Changes go live immediately and can be reset per block.</p></div>
        </div>
        <div class="cms-page-grid">${cards}</div>
      </div>`;
  }

  function pageBlocksPage(page, blocks, csrf, flashMsg) {
    const urlHint = page.id === 'index' ? '/' : page.id === 'shared' ? 'every page (footer)' : '/' + page.id + '.html';
    const items = blocks.map(b => {
      const badge = b.custom ? '<span class="badge badge-new">Customized</span>' : '<span class="badge badge-read">Default</span>';
      return `
        <div class="admin-card cms-block">
          <div class="cms-block-head">
            <div><h2>${esc(b.label)} ${badge}</h2><code class="cms-key">${esc(b.key)}</code></div>
            <button type="button" class="admin-btn admin-btn-outline admin-btn-sm cms-preview-btn" data-preview="block">Preview</button>
          </div>
          <form method="POST" action="/admin/pages/${esc(page.id)}/block">
            <input type="hidden" name="_csrf" value="${esc(csrf)}">
            <input type="hidden" name="key" value="${esc(b.key)}">
            <textarea name="html" class="cms-html" spellcheck="false">${esc(b.html)}</textarea>
            <div class="form-actions">
              <button type="submit" class="admin-btn admin-btn-primary">Save block</button>
              <button type="submit" formaction="/admin/pages/${esc(page.id)}/block/reset" class="admin-btn admin-btn-outline" onclick="return confirm('Reset this block to its default markup? Your saved HTML for this block will be discarded.');">Reset to default</button>
              <span class="cms-hint">Raw HTML is applied exactly as written &mdash; preview before saving.</span>
            </div>
          </form>
          <iframe class="cms-preview" title="Block preview" hidden></iframe>
        </div>`;
    }).join('');
    return `
      <div class="admin-container">
        ${alertBlock(flashMsg)}
        <a href="/admin/pages" class="back-link">${ICONS.back}<span>All pages</span></a>
        <div class="admin-page-header">
          <div><h1>${esc(page.label)}</h1><p>Served at <code>${esc(urlHint)}</code></p></div>
        </div>
        ${items}
      </div>
      ${cmsEditorScript()}`;
  }

  // ----- Modules editor views -----
  function modulesListPage(modules, csrf, flashMsg) {
    const rows = modules.length === 0
      ? `<tr><td colspan="6"><div class="admin-empty">${ICONS.inbox}<h3>No modules yet</h3><p>Add your first training module.</p></div></td></tr>`
      : modules.map(m => {
        const slots = [];
        if (m.homeCardHtml && m.homeCardHtml.trim()) slots.push('home');
        if (m.listCardHtml && m.listCardHtml.trim()) slots.push('list');
        if (m.bodyHtml && m.bodyHtml.trim()) slots.push('body');
        const slotBadge = slots.length
          ? slots.map(s => '<span class="badge badge-replied">' + s + '</span>').join(' ')
          : '<span class="badge badge-read">structured</span>';
        return `<tr>
          <td data-label="#">${esc(m.number || m.id)}</td>
          <td data-label="Title"><a href="/admin/modules/${esc(m.id)}" style="color:var(--primary-dark);font-weight:600;">${esc(m.title)}</a><div class="meta">${esc(m.subtitle || '')}</div></td>
          <td data-label="Level">${esc(m.level || '')}</td>
          <td data-label="Duration">${esc(m.duration || '')}</td>
          <td data-label="Rendering">${slotBadge}</td>
          <td data-label="Actions">
            <div class="action-row">
              <a class="admin-btn admin-btn-outline admin-btn-sm" href="/admin/modules/${esc(m.id)}">Edit</a>
              <form method="POST" action="/admin/modules/${esc(m.id)}/delete" onsubmit="return confirm('Delete this module? A backup is kept in data/backups.');">
                <input type="hidden" name="_csrf" value="${esc(csrf)}">
                <button type="submit" class="admin-btn admin-btn-danger admin-btn-sm">${ICONS.trash}<span>Delete</span></button>
              </form>
            </div>
          </td>
        </tr>`;
      }).join('');
    return `
      <div class="admin-container">
        ${alertBlock(flashMsg)}
        <div class="admin-page-header">
          <div><h1>Training Modules</h1><p>Modules power the home cards, the learning list, and each module detail page.</p></div>
          <a href="/admin/modules/new" class="admin-btn admin-btn-primary">+ Add module</a>
        </div>
        <table class="admin-table">
          <thead><tr><th>#</th><th>Title</th><th>Level</th><th>Duration</th><th>Rendering</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function moduleEditPage(m, isNew, defaults, csrf, flashMsg) {
    const slot = (name, label, hint, kind) => `
        <div class="cms-block">
          <div class="cms-block-head">
            <div><h2>${label}</h2><span class="cms-hint">${hint}</span></div>
            <div class="action-row">
              <button type="button" class="admin-btn admin-btn-outline admin-btn-sm cms-load-default" data-slot="${name}">Load current markup</button>
              <button type="button" class="admin-btn admin-btn-outline admin-btn-sm cms-preview-btn" data-preview="${kind}">Preview</button>
            </div>
          </div>
          <textarea name="${name}" data-slot="${name}" class="cms-html" spellcheck="false" placeholder="Leave empty to use the structured markup built from the fields above.">${esc(m[name] || '')}</textarea>
          <textarea class="cms-default-src" data-slot="${name}" hidden>${esc(defaults[name] || '')}</textarea>
          <iframe class="cms-preview" title="Preview" hidden></iframe>
        </div>`;
    return `
      <div class="admin-container">
        ${alertBlock(flashMsg)}
        <a href="/admin/modules" class="back-link">${ICONS.back}<span>All modules</span></a>
        <div class="admin-page-header">
          <div><h1>${isNew ? 'Add module' : 'Edit module ' + esc(m.number || m.id)}</h1><p>${isNew ? 'Create a new training module.' : 'Update the details, or override the markup with raw HTML.'}</p></div>
        </div>
        <form method="POST" action="/admin/modules/save" class="admin-form">
          <input type="hidden" name="_csrf" value="${esc(csrf)}">
          <input type="hidden" name="_isNew" value="${isNew ? '1' : '0'}">
          <div class="admin-card">
            <div class="cms-field-grid">
              <div>
                <label for="mId">Module ID (routing &amp; progress)</label>
                <input type="number" id="mId" name="id" min="1" step="1" value="${esc(m.id)}" ${isNew ? '' : 'readonly'} required>
              </div>
              <div>
                <label for="mNumber">Number (display)</label>
                <input type="text" id="mNumber" name="number" value="${esc(m.number || '')}" placeholder="09">
              </div>
            </div>
            <label for="mTitle">Title</label>
            <input type="text" id="mTitle" name="title" value="${esc(m.title || '')}" required>
            <label for="mSubtitle">Subtitle</label>
            <input type="text" id="mSubtitle" name="subtitle" value="${esc(m.subtitle || '')}">
            <div class="cms-field-grid">
              <div><label for="mDuration">Duration</label><input type="text" id="mDuration" name="duration" value="${esc(m.duration || '')}" placeholder="2 hours"></div>
              <div><label for="mLevel">Level</label><input type="text" id="mLevel" name="level" value="${esc(m.level || '')}" placeholder="Beginner"></div>
            </div>
            <label for="mDesc">Description</label>
            <textarea id="mDesc" name="description" style="min-height:90px;">${esc(m.description || '')}</textarea>
          </div>
          <div class="admin-card">
            <h2 style="font-size:1.15rem;color:var(--primary-dark);margin-bottom:0.35rem;">Raw HTML overrides</h2>
            <p class="cms-hint" style="margin-bottom:1rem;">Each override replaces one part of the module. Leave a box empty to keep the structured markup generated from the fields above plus the module's topics, objectives and lessons.</p>
            ${slot('homeCardHtml', 'Home card', 'Inner HTML of the card on the home page grid.', 'home')}
            ${slot('listCardHtml', 'Learning list card', 'Inner HTML of the card in the learning page list.', 'list')}
            ${slot('bodyHtml', 'Module page body', 'Full body of the detail page, between the banner and the prev/next pager.', 'body')}
            <div class="form-actions" style="margin-top:1.25rem;">
              <button type="submit" class="admin-btn admin-btn-primary">${isNew ? 'Create module' : 'Save changes'}</button>
              <a href="/admin/modules" class="admin-btn admin-btn-outline">Cancel</a>
            </div>
          </div>
        </form>
      </div>
      ${cmsEditorScript()}`;
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

  // ===== CMS: Pages (raw-HTML block editor) =====
  router.get('/pages', requireAdmin, (req, res) => {
    const csrf = ensureCsrf(req);
    res.send(layout('Pages', pagesPickerPage(content.getPages(), csrf, takeFlash(req)), { activeNav: 'pages', isAdmin: true, csrf }));
  });

  router.get('/pages/:page', requireAdmin, (req, res) => {
    const csrf = ensureCsrf(req);
    const page = content.getPages().find(p => p.id === req.params.page);
    if (!page) {
      return res.status(404).send(layout('Not found', '<div class="admin-container"><div class="alert alert-error">Unknown page. <a href="/admin/pages" style="text-decoration:underline;">Back to pages</a></div></div>', { activeNav: 'pages', isAdmin: true, csrf }));
    }
    const blocks = page.blocks.map(b => ({ key: b.key, label: b.label, html: content.getBlock(b.key), custom: content.isBlockCustom(b.key) }));
    res.send(layout(page.label, pageBlocksPage(page, blocks, csrf, takeFlash(req)), { activeNav: 'pages', isAdmin: true, csrf }));
  });

  router.post('/pages/:page/block', requireAdmin, verifyCsrf, (req, res) => {
    const page = req.params.page;
    const key = (req.body.key || '').trim();
    const html = req.body.html == null ? '' : String(req.body.html);
    if (!key) { flash(req, 'error', 'Missing block key.'); return res.redirect('/admin/pages/' + encodeURIComponent(page)); }
    content.setBlock(key, html);
    flash(req, 'success', 'Block "' + key + '" saved. A backup was created.');
    res.redirect('/admin/pages/' + encodeURIComponent(page));
  });

  router.post('/pages/:page/block/reset', requireAdmin, verifyCsrf, (req, res) => {
    const page = req.params.page;
    const key = (req.body.key || '').trim();
    if (!key) { flash(req, 'error', 'Missing block key.'); return res.redirect('/admin/pages/' + encodeURIComponent(page)); }
    content.resetBlock(key);
    flash(req, 'success', 'Block "' + key + '" reset to default.');
    res.redirect('/admin/pages/' + encodeURIComponent(page));
  });

  // ===== CMS: Modules (collection CRUD + raw-HTML slots) =====
  router.get('/modules', requireAdmin, (req, res) => {
    const csrf = ensureCsrf(req);
    res.send(layout('Modules', modulesListPage(content.getModules(), csrf, takeFlash(req)), { activeNav: 'modules', isAdmin: true, csrf }));
  });

  router.get('/modules/new', requireAdmin, (req, res) => {
    const csrf = ensureCsrf(req);
    const skeleton = { id: content.nextModuleId(), number: '', title: '', subtitle: '', duration: '', level: '', description: '', topics: [], objectives: [], lessons: [], homeCardHtml: '', listCardHtml: '', bodyHtml: '' };
    const defaults = { homeCardHtml: defaultHomeCard(skeleton), listCardHtml: defaultListCard(skeleton), bodyHtml: defaultBody(skeleton) };
    res.send(layout('Add module', moduleEditPage(skeleton, true, defaults, csrf, takeFlash(req)), { activeNav: 'modules', isAdmin: true, csrf }));
  });

  router.get('/modules/:id', requireAdmin, (req, res) => {
    const csrf = ensureCsrf(req);
    const mod = content.getModule(req.params.id);
    if (!mod) {
      return res.status(404).send(layout('Not found', '<div class="admin-container"><div class="alert alert-error">Module not found. <a href="/admin/modules" style="text-decoration:underline;">Back to modules</a></div></div>', { activeNav: 'modules', isAdmin: true, csrf }));
    }
    const defaults = { homeCardHtml: defaultHomeCard(mod), listCardHtml: defaultListCard(mod), bodyHtml: defaultBody(mod) };
    res.send(layout('Edit module', moduleEditPage(mod, false, defaults, csrf, takeFlash(req)), { activeNav: 'modules', isAdmin: true, csrf }));
  });

  router.post('/modules/save', requireAdmin, verifyCsrf, (req, res) => {
    const b = req.body;
    const isNew = b._isNew === '1';
    const id = Number(b.id);
    const title = (b.title || '').trim();
    if (!Number.isInteger(id) || id < 1) {
      flash(req, 'error', 'Module ID must be a positive whole number.');
      return res.redirect(isNew ? '/admin/modules/new' : '/admin/modules');
    }
    if (!title) {
      flash(req, 'error', 'Title is required.');
      return res.redirect(isNew ? '/admin/modules/new' : '/admin/modules/' + encodeURIComponent(id));
    }
    if (isNew && content.getModule(id)) {
      flash(req, 'error', 'A module with ID ' + id + ' already exists.');
      return res.redirect('/admin/modules/new');
    }
    const existing = content.getModule(id) || {};
    const mod = Object.assign({}, existing, {
      id,
      number: (b.number || '').trim() || String(id).padStart(2, '0'),
      title,
      subtitle: (b.subtitle || '').trim(),
      duration: (b.duration || '').trim(),
      level: (b.level || '').trim(),
      description: (b.description || '').trim(),
      homeCardHtml: b.homeCardHtml == null ? '' : String(b.homeCardHtml),
      listCardHtml: b.listCardHtml == null ? '' : String(b.listCardHtml),
      bodyHtml: b.bodyHtml == null ? '' : String(b.bodyHtml)
    });
    if (!Array.isArray(mod.topics)) mod.topics = [];
    if (!Array.isArray(mod.objectives)) mod.objectives = [];
    if (!Array.isArray(mod.lessons)) mod.lessons = [];
    content.saveModule(mod);
    flash(req, 'success', 'Module "' + title + '" saved. A backup was created.');
    res.redirect('/admin/modules/' + encodeURIComponent(id));
  });

  router.post('/modules/:id/delete', requireAdmin, verifyCsrf, (req, res) => {
    const mod = content.getModule(req.params.id);
    if (!mod) { flash(req, 'error', 'Module not found.'); return res.redirect('/admin/modules'); }
    content.deleteModule(req.params.id);
    flash(req, 'success', 'Module "' + (mod.title || mod.id) + '" deleted.');
    res.redirect('/admin/modules');
  });

  return router;
};

// ===== Navbar Scroll =====
const navbar = document.getElementById('navbar');
if (navbar) window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));

// ===== Mobile Menu =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const s = hamburger.querySelectorAll('span');
    if (navLinks.classList.contains('open')) {
      s[0].style.transform = 'rotate(45deg) translate(5px,6px)';
      s[1].style.opacity = '0';
      s[2].style.transform = 'rotate(-45deg) translate(5px,-6px)';
    } else { s[0].style.transform=''; s[1].style.opacity=''; s[2].style.transform=''; }
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { if(navLinks.classList.contains('open')) hamburger.click(); }));
}

// ===== Toast =====
function showToast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.className = 'toast ' + type;
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== Password Toggle =====
function setSvgPaths(svg, paths) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  paths.forEach(d => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', d.tag || 'path');
    Object.keys(d).forEach(k => { if (k !== 'tag') el.setAttribute(k, d[k]); });
    svg.appendChild(el);
  });
}
const eyeOpen = [{ d:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }, { tag:'circle', cx:'12', cy:'12', r:'3' }];
const eyeOff = [{ d:'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' }, { tag:'line', x1:'1', y1:'1', x2:'23', y2:'23' }];
document.querySelectorAll('.password-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.input-wrapper').querySelector('input');
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    setSvgPaths(btn.querySelector('svg'), show ? eyeOff : eyeOpen);
  });
});

// ===== Shared Helpers (icons, escaping, validation) =====
const ICON_MAP = {
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
  chevronDown: '<polyline points="6 9 12 15 18 9"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
};
function iconSvg(name, cls) {
  const inner = ICON_MAP[name] || ICON_MAP.check;
  return '<svg class="' + (cls || 'icon icon-sm') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
}
function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Inline Field Validation =====
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function getFieldErrorEl(input) {
  const group = input.closest('.form-group');
  if (!group) return null;
  let el = group.querySelector('.field-error');
  if (!el) { el = document.createElement('div'); el.className = 'field-error'; el.style.display = 'none'; group.appendChild(el); }
  return el;
}
function setFieldState(input, message) {
  const wrap = input.closest('.input-wrapper') || input;
  const errEl = getFieldErrorEl(input);
  if (message) {
    wrap.classList.add('invalid'); wrap.classList.remove('valid');
    if (errEl) { errEl.textContent = message; errEl.style.display = 'block'; }
    input.setAttribute('aria-invalid', 'true');
    return false;
  }
  wrap.classList.remove('invalid'); wrap.classList.add('valid');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  input.removeAttribute('aria-invalid');
  return true;
}
function validateEmail(v) {
  if (!v || !v.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(v.trim())) return 'Please enter a valid email address.';
  return '';
}
function validatePassword(v) {
  if (!v) return 'Password is required.';
  if (v.length < 6) return 'Password must be at least 6 characters.';
  return '';
}
function validateName(v) {
  if (!v || !v.trim()) return 'Full name is required.';
  if (v.trim().length < 2) return 'Please enter at least 2 characters.';
  return '';
}

// ===== Login Form (inline validation + 3-attempt lockout) =====
const LOGIN_MAX_ATTEMPTS = 3;
const LOGIN_LOCK_MS = 30000; // 30 seconds
const LOGIN_STORE_KEY = 'dbz_login_lock';
function readLoginLock() {
  try { return JSON.parse(localStorage.getItem(LOGIN_STORE_KEY)) || { count: 0, lockedUntil: 0 }; }
  catch { return { count: 0, lockedUntil: 0 }; }
}
function writeLoginLock(s) { try { localStorage.setItem(LOGIN_STORE_KEY, JSON.stringify(s)); } catch {} }
function clearLoginLock() { try { localStorage.removeItem(LOGIN_STORE_KEY); } catch {} }

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const email = document.getElementById('email');
  const pw = document.getElementById('password');
  const btn = document.getElementById('loginBtn');

  let lockMsg = document.getElementById('loginLockout');
  if (!lockMsg) {
    lockMsg = document.createElement('div');
    lockMsg.id = 'loginLockout';
    lockMsg.className = 'lockout-msg';
    lockMsg.style.display = 'none';
    btn.parentNode.insertBefore(lockMsg, btn);
  }

  let countdownTimer = null;
  function setLockedUI(sec) {
    btn.disabled = true; email.disabled = true; pw.disabled = true;
    lockMsg.style.display = 'flex';
    lockMsg.innerHTML = iconSvg('lock') + '<span>Too many failed attempts. Try again in <strong>' + sec + 's</strong>.</span>';
  }
  function setUnlockedUI() {
    btn.disabled = false; email.disabled = false; pw.disabled = false;
    lockMsg.style.display = 'none';
    btn.textContent = 'Sign In';
  }
  function startCountdown(untilTs) {
    if (countdownTimer) clearInterval(countdownTimer);
    const tick = () => {
      const left = Math.ceil((untilTs - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(countdownTimer); countdownTimer = null;
        writeLoginLock({ count: 0, lockedUntil: 0 });
        setUnlockedUI();
      } else { setLockedUI(left); }
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  // Resume an active lockout on page load
  const initLock = readLoginLock();
  if (initLock.lockedUntil && initLock.lockedUntil > Date.now()) startCountdown(initLock.lockedUntil);

  // Live validation
  email.addEventListener('blur', () => setFieldState(email, validateEmail(email.value)));
  pw.addEventListener('blur', () => setFieldState(pw, validatePassword(pw.value)));
  email.addEventListener('input', () => { if (email.closest('.input-wrapper').classList.contains('invalid')) setFieldState(email, validateEmail(email.value)); });
  pw.addEventListener('input', () => { if (pw.closest('.input-wrapper').classList.contains('invalid')) setFieldState(pw, validatePassword(pw.value)); });

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const lock = readLoginLock();
    if (lock.lockedUntil && lock.lockedUntil > Date.now()) { startCountdown(lock.lockedUntil); return; }

    if (!setFieldState(email, validateEmail(email.value))) { email.focus(); return; }
    if (!setFieldState(pw, validatePassword(pw.value))) { pw.focus(); return; }

    btn.textContent = 'Signing in...'; btn.disabled = true;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), password: pw.value })
      });
      const data = await res.json();

      if (data.success) {
        clearLoginLock();
        showToast(data.message, 'success');
        setTimeout(() => location.href = '/dashboard.html', 1000);
      } else {
        const st = readLoginLock();
        st.count += 1;
        if (st.count >= LOGIN_MAX_ATTEMPTS) {
          st.lockedUntil = Date.now() + LOGIN_LOCK_MS;
          writeLoginLock(st);
          showToast(data.message, 'error');
          startCountdown(st.lockedUntil);
        } else {
          writeLoginLock(st);
          const remaining = LOGIN_MAX_ATTEMPTS - st.count;
          showToast(data.message + ' ' + remaining + ' attempt' + (remaining === 1 ? '' : 's') + ' remaining.', 'error');
          btn.textContent = 'Sign In'; btn.disabled = false;
        }
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
      btn.textContent = 'Sign In'; btn.disabled = false;
    }
  });
}

// ===== Register Form (inline validation) =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const name = document.getElementById('regName');
  const email = document.getElementById('regEmail');
  const pw = document.getElementById('regPassword');
  const confirmPw = document.getElementById('regConfirmPassword');
  const btn = document.getElementById('registerBtn');

  const validateConfirm = () => {
    if (!confirmPw.value) return 'Please confirm your password.';
    if (confirmPw.value !== pw.value) return 'Passwords do not match.';
    return '';
  };

  name.addEventListener('blur', () => setFieldState(name, validateName(name.value)));
  email.addEventListener('blur', () => setFieldState(email, validateEmail(email.value)));
  pw.addEventListener('blur', () => setFieldState(pw, validatePassword(pw.value)));
  confirmPw.addEventListener('blur', () => setFieldState(confirmPw, validateConfirm()));
  [name, email, pw, confirmPw].forEach(inp => inp.addEventListener('input', () => {
    const w = inp.closest('.input-wrapper');
    if (!w || !w.classList.contains('invalid')) return;
    if (inp === confirmPw) setFieldState(inp, validateConfirm());
    else if (inp === name) setFieldState(inp, validateName(inp.value));
    else if (inp === email) setFieldState(inp, validateEmail(inp.value));
    else setFieldState(inp, validatePassword(inp.value));
  }));

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!setFieldState(name, validateName(name.value))) { name.focus(); return; }
    if (!setFieldState(email, validateEmail(email.value))) { email.focus(); return; }
    if (!setFieldState(pw, validatePassword(pw.value))) { pw.focus(); return; }
    if (!setFieldState(confirmPw, validateConfirm())) { confirmPw.focus(); return; }

    btn.textContent = 'Creating account...'; btn.disabled = true;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.value.trim(), email: email.value.trim(), password: pw.value })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        setTimeout(() => location.href = '/dashboard.html', 1000);
      } else {
        showToast(data.message, 'error');
        btn.textContent = 'Create Account'; btn.disabled = false;
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
      btn.textContent = 'Create Account'; btn.disabled = false;
    }
  });
}

// ===== Logout =====
document.querySelectorAll('#logoutBtn, #logoutBtnMobile').forEach(btn => {
  btn.addEventListener('click', async e => {
    e.preventDefault();
    try {
      await fetch('/api/logout', { method: 'POST' });
      showToast('Logged out successfully.', 'success');
      setTimeout(() => location.href = '/', 800);
    } catch {
      location.href = '/';
    }
  });
});

// ===== Dashboard =====
const MODULES = [
  { id: 1, name: 'Introduction to Digital Literacy', subtitle: 'Build your foundation in digital technology' },
  { id: 2, name: 'Online Safety & Cyber Hygiene', subtitle: 'Protect yourself in the digital world' },
  { id: 3, name: 'Digital Communication & Collaboration', subtitle: 'Connect and work with others effectively' },
  { id: 4, name: 'Information & Media Literacy', subtitle: 'Think critically about what you see online' },
  { id: 5, name: 'Digital Financial Literacy', subtitle: 'Manage money safely in the digital age' },
  { id: 6, name: 'Productivity & Work Readiness', subtitle: 'Build skills for the modern workplace' },
  { id: 7, name: 'Digital Entrepreneurship', subtitle: 'Grow your business using digital tools' },
  { id: 8, name: 'Responsible Digital Citizenship', subtitle: 'Be a positive force in the digital world' }
];

if (window.__USER__) {
  const user = window.__USER__;
  const progress = window.__PROGRESS__ || [];

  // Greeting
  const greeting = document.getElementById('dashGreeting');
  if (greeting) greeting.textContent = 'Welcome back, ' + user.name + '!';

  // Profile fields
  const pName = document.getElementById('profileName');
  const pEmail = document.getElementById('profileEmail');
  if (pName) pName.value = user.name || '';
  if (pEmail) pEmail.value = user.email || '';

  // Member info
  const memberSince = document.getElementById('memberSince');
  if (memberSince && user.joined) memberSince.textContent = new Date(user.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const userRole = document.getElementById('userRole');
  if (userRole) userRole.textContent = (user.role || 'learner').charAt(0).toUpperCase() + (user.role || 'learner').slice(1);

  // Build progress cards
  const container = document.getElementById('progressModules');
  if (container) {
    let completed = 0, inProgress = 0;

    MODULES.forEach(mod => {
      const p = progress.find(x => x.moduleId === mod.id);
      const status = p ? p.status : 'not_started';
      if (status === 'completed') completed++;
      else if (status === 'in_progress') inProgress++;

      const statusLabel = status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Not Started';
      const statusColor = status === 'completed' ? 'var(--success)' : status === 'in_progress' ? 'var(--accent)' : 'var(--text-muted)';

      const card = document.createElement('div');
      card.className = 'module-card animate-on-scroll';
      card.innerHTML = `
        <div class="module-number">${mod.id}</div>
        <h3>${mod.name}</h3>
        <p>${mod.subtitle}</p>
        <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="progress-btn ${status === 'not_started' ? 'active' : ''}" data-module="${mod.id}" data-status="not_started" style="padding:0.35rem 0.8rem;border-radius:6px;border:2px solid var(--border);background:${status === 'not_started' ? 'var(--bg)' : 'transparent'};cursor:pointer;font-size:0.8rem;font-weight:600;color:var(--text-muted);transition:var(--transition);">Not Started</button>
          <button class="progress-btn ${status === 'in_progress' ? 'active' : ''}" data-module="${mod.id}" data-status="in_progress" style="padding:0.35rem 0.8rem;border-radius:6px;border:2px solid ${status === 'in_progress' ? 'var(--accent)' : 'var(--border)'};background:${status === 'in_progress' ? 'rgba(14,165,233,0.1)' : 'transparent'};cursor:pointer;font-size:0.8rem;font-weight:600;color:${status === 'in_progress' ? 'var(--accent)' : 'var(--text-muted)'};transition:var(--transition);">In Progress</button>
          <button class="progress-btn ${status === 'completed' ? 'active' : ''}" data-module="${mod.id}" data-status="completed" style="padding:0.35rem 0.8rem;border-radius:6px;border:2px solid ${status === 'completed' ? 'var(--success)' : 'var(--border)'};background:${status === 'completed' ? 'rgba(34,197,94,0.1)' : 'transparent'};cursor:pointer;font-size:0.8rem;font-weight:600;color:${status === 'completed' ? 'var(--success)' : 'var(--text-muted)'};transition:var(--transition);">Completed</button>
        </div>
      `;
      container.appendChild(card);
    });

    // Stats
    const notStarted = 8 - completed - inProgress;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statInProgress').textContent = inProgress;
    document.getElementById('statNotStarted').textContent = notStarted;
    document.getElementById('statPercent').textContent = Math.round((completed / 8) * 100) + '%';

    // Progress button clicks
    container.addEventListener('click', async e => {
      const btn = e.target.closest('.progress-btn');
      if (!btn) return;
      const moduleId = parseInt(btn.dataset.module);
      const status = btn.dataset.status;

      btn.disabled = true;
      try {
        const res = await fetch('/api/user/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId, status })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Progress updated!', 'success');
          // Refresh page to update stats
          location.reload();
        } else {
          showToast(data.message, 'error');
          btn.disabled = false;
        }
      } catch {
        showToast('Network error.', 'error');
        btn.disabled = false;
      }
    });
  }

  // Profile form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('profileName').value.trim();
      const email = document.getElementById('profileEmail').value.trim();
      const btn = profileForm.querySelector('button[type="submit"]');
      const orig = btn.textContent;

      btn.textContent = 'Saving...'; btn.disabled = true;
      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
        } else {
          showToast(data.message, 'error');
        }
      } catch {
        showToast('Network error.', 'error');
      }
      btn.textContent = orig; btn.disabled = false;
    });
  }

  // Password form
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async e => {
      e.preventDefault();
      const current = document.getElementById('currentPassword').value;
      const newPw = document.getElementById('newPassword').value;
      const confirm = document.getElementById('confirmNewPassword').value;

      if (!current) { showToast('Enter your current password.', 'error'); return; }
      if (!newPw || newPw.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
      if (newPw !== confirm) { showToast('Passwords do not match.', 'error'); return; }

      const btn = passwordForm.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Changing...'; btn.disabled = true;

      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: current, newPassword: newPw })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          passwordForm.reset();
        } else {
          showToast(data.message, 'error');
        }
      } catch {
        showToast('Network error.', 'error');
      }
      btn.textContent = orig; btn.disabled = false;
    });
  }
}

// ===== Contact Form =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const n = document.getElementById('contactName'), em = document.getElementById('contactEmail'), sub = document.getElementById('contactSubject'), msg = document.getElementById('contactMessage');
    if (!n.value.trim()) { showToast('Please enter your name.', 'error'); n.focus(); return; }
    if (!em.value || !em.value.includes('@')) { showToast('Please enter a valid email.', 'error'); em.focus(); return; }
    if (!sub.value) { showToast('Please select a subject.', 'error'); sub.focus(); return; }
    if (!msg.value.trim() || msg.value.trim().length < 10) { showToast('Message must be at least 10 characters.', 'error'); msg.focus(); return; }
    const b = contactForm.querySelector('button[type="submit"]'), orig = b.textContent;
    b.textContent = 'Sending...'; b.disabled = true;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n.value.trim(), email: em.value.trim(), subject: sub.value, message: msg.value.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Message sent! We will get back to you soon.', 'success');
        contactForm.reset();
      } else {
        showToast(data.message || 'Failed to send message.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      b.textContent = orig; b.disabled = false;
    }
  });
}

// ===== Learning Page: Module Cards (2 visible + View More) =====
const MODULE_INITIAL_VISIBLE = 2;
const moduleListEl = document.getElementById('moduleList');
if (moduleListEl && window.MODULES_DATA) {
  const data = window.MODULES_DATA;
  let expanded = false;

  const cardHtml = (mod, hidden) => {
    const wrapperOpen = '<a class="module-list-card' + (hidden ? ' module-hidden' : '') + '" href="module.html?id=' + mod.id + '">';
    // CMS override: use the module's raw listCardHtml when set, else structured markup.
    if (mod.listCardHtml && mod.listCardHtml.trim()) return wrapperOpen + mod.listCardHtml + '</a>';
    const topics = (mod.topics || []).slice(0, 4).map(t =>
      '<span class="topic-chip"><span class="topic-icon">' + iconSvg(t.icon) + '</span><span>' + escHtml(t.label) + '</span></span>'
    ).join('');
    return wrapperOpen +
      '<div class="module-list-top">' +
        '<div class="module-detail-number">' + escHtml(mod.number) + '</div>' +
        '<div class="module-list-title"><h3>' + escHtml(mod.title) + '</h3><p class="module-subtitle">' + escHtml(mod.subtitle) + '</p></div>' +
      '</div>' +
      '<p class="module-list-desc">' + escHtml(mod.description) + '</p>' +
      '<div class="module-topics-list static">' + topics + '</div>' +
      '<div class="module-list-foot">' +
        '<span class="module-meta-pill">' + iconSvg('clock') + escHtml(mod.duration) + '</span>' +
        '<span class="module-meta-pill">' + escHtml(mod.level) + '</span>' +
        '<span class="module-open-link">Open module ' + iconSvg('arrowRight') + '</span>' +
      '</div>' +
    '</a>';
  };

  const render = () => {
    moduleListEl.innerHTML = data.map((mod, i) => cardHtml(mod, !expanded && i >= MODULE_INITIAL_VISIBLE)).join('');
  };

  render();

  const viewMoreBtn = document.getElementById('viewMoreBtn');
  const viewMoreWrap = document.getElementById('viewMoreWrap');
  if (data.length <= MODULE_INITIAL_VISIBLE && viewMoreWrap) viewMoreWrap.style.display = 'none';
  if (viewMoreBtn) {
    const setLabel = () => {
      viewMoreBtn.innerHTML = (expanded ? 'Show Less ' : 'View More Modules (' + (data.length - MODULE_INITIAL_VISIBLE) + ' more) ') +
        '<svg class="icon icon-sm" style="transform:rotate(' + (expanded ? '180' : '0') + 'deg);transition:var(--transition);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    };
    setLabel();
    viewMoreBtn.addEventListener('click', () => {
      expanded = !expanded;
      render();
      setLabel();
      if (!expanded) moduleListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

// ===== Home Page: Module Cards (2 visible + View More) =====
const homeModuleGrid = document.getElementById('homeModuleGrid');
if (homeModuleGrid && window.MODULES_DATA) {
  const data = window.MODULES_DATA;
  const HOME_INITIAL_VISIBLE = 2;
  let homeExpanded = false;

  const homeCardHtml = (mod, hidden) => {
    const wrapperOpen = '<a class="module-card home-module-card' + (hidden ? ' home-module-hidden' : '') + '" href="module.html?id=' + mod.id + '">';
    // CMS override: use the module's raw homeCardHtml when set, else structured markup.
    if (mod.homeCardHtml && mod.homeCardHtml.trim()) return wrapperOpen + mod.homeCardHtml + '</a>';
    return wrapperOpen +
      '<div class="module-number">' + escHtml(mod.number) + '</div>' +
      '<h3>' + escHtml(mod.title) + '</h3>' +
      '<p>' + escHtml(mod.subtitle) + '</p>' +
      '<div class="module-topics">' + (mod.topics || []).slice(0, 3).map(t => '<span>' + escHtml(t.label) + '</span>').join('') + '</div>' +
    '</a>';
  };

  const renderHome = () => {
    homeModuleGrid.innerHTML = data.map((mod, i) => homeCardHtml(mod, !homeExpanded && i >= HOME_INITIAL_VISIBLE)).join('');
  };
  renderHome();

  const homeViewMoreBtn = document.getElementById('homeViewMoreBtn');
  const homeViewMoreWrap = document.getElementById('homeViewMoreWrap');
  if (data.length <= HOME_INITIAL_VISIBLE && homeViewMoreWrap) homeViewMoreWrap.style.display = 'none';
  if (homeViewMoreBtn) {
    const setHomeLabel = () => {
      homeViewMoreBtn.innerHTML = (homeExpanded ? 'Show Less ' : 'View More Modules (' + (data.length - HOME_INITIAL_VISIBLE) + ' more) ') +
        '<svg class="icon icon-sm" style="transform:rotate(' + (homeExpanded ? '180' : '0') + 'deg);transition:var(--transition);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    };
    setHomeLabel();
    homeViewMoreBtn.addEventListener('click', () => {
      homeExpanded = !homeExpanded;
      renderHome();
      setHomeLabel();
      if (!homeExpanded) homeModuleGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}

// ===== Module Detail Page (module.html?id=N) =====
const modulePageEl = document.getElementById('modulePage');
if (modulePageEl && window.MODULES_DATA) {
  const data = window.MODULES_DATA;
  const id = parseInt(new URLSearchParams(location.search).get('id'), 10);
  const idx = data.findIndex(m => m.id === id);

  if (idx === -1) {
    modulePageEl.innerHTML =
      '<div class="module-notfound">' + iconSvg('alert', 'icon icon-xl') +
      '<h1>Module not found</h1><p>The module you are looking for does not exist or has been moved.</p>' +
      '<a href="learning.html" class="btn btn-primary">Back to all modules</a></div>';
  } else {
    const mod = data[idx];
    document.title = mod.title + ' - Digital Bridges Zambia';
    const prev = data[idx - 1], next = data[idx + 1];

    const topics = (mod.topics || []).map(t =>
      '<div class="topic-chip"><span class="topic-icon">' + iconSvg(t.icon) + '</span><span>' + escHtml(t.label) + '</span></div>').join('');
    const objectives = (mod.objectives || []).map(o =>
      '<li class="objective-row">' + iconSvg('check', 'icon icon-sm obj-check') + '<span>' + escHtml(o) + '</span></li>').join('');
    const lessons = (mod.lessons || []).map((l, i) =>
      '<div class="lesson-item"><div class="lesson-num">' + (i + 1) + '</div><div><h4>' + escHtml(l.title) + '</h4><p>' + escHtml(l.summary) + '</p></div></div>').join('');

    modulePageEl.innerHTML =
      '<section class="page-banner module-banner">' +
        '<a href="learning.html" class="module-back">' + iconSvg('arrowLeft', 'icon icon-sm') + '<span>All modules</span></a>' +
        '<h1>' + escHtml(mod.title) + '</h1>' +
        '<p>' + escHtml(mod.subtitle) + '</p>' +
        '<div class="module-banner-meta">' +
          '<span class="module-meta-pill light">' + iconSvg('clock') + escHtml(mod.duration) + '</span>' +
          '<span class="module-meta-pill light">' + iconSvg('target') + escHtml(mod.level) + '</span>' +
          '<span class="module-meta-pill light">' + iconSvg('book') + (mod.lessons || []).length + ' lessons</span>' +
        '</div>' +
      '</section>' +
      '<section class="section"><div class="section-inner" style="max-width:900px;">' +
        // CMS override: use the module's raw bodyHtml when set, else structured body.
        // The banner above and the pager below are always generated.
        ((mod.bodyHtml && mod.bodyHtml.trim()) ? mod.bodyHtml :
          '<div class="module-body-block"><h2>About this module</h2><p>' + escHtml(mod.description) + '</p></div>' +
          '<div class="module-body-block"><h2>What you will learn</h2><ul class="objectives-check">' + objectives + '</ul></div>' +
          '<div class="module-body-block"><h2>Topics covered</h2><div class="module-topics-list static">' + topics + '</div></div>' +
          '<div class="module-body-block"><h2>Lessons</h2><div class="lessons-list">' + lessons + '</div></div>' +
          '<div class="module-cta"><a href="login.html" class="btn btn-primary">Start this module</a>' +
            '<span>Sign in to track your progress and mark this module complete.</span></div>') +
        '<div class="module-pager">' +
          (prev ? '<a class="pager-link prev" href="module.html?id=' + prev.id + '">' + iconSvg('arrowLeft', 'icon icon-sm') + '<span><small>Previous</small>' + escHtml(prev.title) + '</span></a>' : '<span></span>') +
          (next ? '<a class="pager-link next" href="module.html?id=' + next.id + '"><span><small>Next</small>' + escHtml(next.title) + '</span>' + iconSvg('arrowRight', 'icon icon-sm') + '</a>' : '<span></span>') +
        '</div>' +
      '</div></section>';
  }
}

// ===== FAQ Accordion =====
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o => {
      if (o !== item) { o.classList.remove('open'); const b = o.querySelector('.faq-question'); if (b) b.setAttribute('aria-expanded', 'false'); }
    });
    item.classList.toggle('open', !isOpen);
    q.setAttribute('aria-expanded', String(!isOpen));
  });
});

// ===== Scroll Animations =====
const obs = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); } });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.animate-on-scroll').forEach((el, i) => {
  el.style.opacity = '0'; el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s ease '+(i%6)*0.08+'s, transform 0.6s ease '+(i%6)*0.08+'s';
  obs.observe(el);
});
const ss = document.createElement('style'); ss.textContent = '.animate-on-scroll.visible{opacity:1!important;transform:translateY(0)!important}'; document.head.appendChild(ss);

// ===== Stats Counter =====
let counted = false;
function animateStats() {
  if (counted) return;
  const bar = document.querySelector('.stats-bar');
  if (!bar) return;
  const r = bar.getBoundingClientRect();
  if (r.top < window.innerHeight && r.bottom > 0) {
    counted = true;
    document.querySelectorAll('.stat-item h3').forEach(s => {
      const target = parseInt(s.textContent), suffix = s.textContent.replace(/[0-9]/g, '');
      if (isNaN(target)) return;
      let cur = 0; const inc = Math.max(1, Math.floor(target/30));
      const timer = setInterval(() => { cur += inc; if (cur >= target) { cur = target; clearInterval(timer); } s.textContent = cur + suffix; }, 40);
    });
  }
}
if (document.querySelectorAll('.stat-item h3').length) { window.addEventListener('scroll', animateStats); animateStats(); }

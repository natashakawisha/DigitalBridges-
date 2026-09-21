# Digital Bridges Zambia — Complete Project Documentation
## Full-Stack Architecture & Request Flow Guide

---

## Table of Contents

1. [Project Architecture Overview](#1-project-architecture-overview)
2. [Technologies Used](#2-technologies-used)
3. [Project File Structure](#3-project-file-structure)
4. [How the Server Works](#4-how-the-server-works)
5. [How the Database Works](#5-how-the-database-works)
6. [How Sessions Work](#6-how-sessions-work)
7. [Complete Flow: Registration (Sign Up)](#7-complete-flow-registration-sign-up)
8. [Complete Flow: Login](#8-complete-flow-login)
9. [Complete Flow: Tracking Module Progress](#9-complete-flow-tracking-module-progress)
10. [Complete Flow: Logout](#10-complete-flow-logout)
11. [Complete Flow: Editing Profile](#11-complete-flow-editing-profile)
12. [Complete Flow: Changing Password](#12-complete-flow-changing-password)
13. [How the Frontend and Backend Communicate](#13-how-the-frontend-and-backend-communicate)
14. [Security Measures](#14-security-measures)
15. [Full Request Lifecycle Summary](#15-full-request-lifecycle-summary)
16. [How to Run the Project](#16-how-to-run-the-project)
17. [Complete Application Map](#17-complete-application-map)
18. [Step-by-Step Creation Guide](#18-step-by-step-creation-guide-how-this-site-was-built)
19. [Complete API Reference](#19-complete-api-reference)

---

## 1. Project Architecture Overview

```
┌──────────────┐     HTTP Request      ┌──────────────────┐     Read/Write     ┌──────────────┐
│   BROWSER    │ ◄──────────────────► │  EXPRESS SERVER   │ ◄───────────────► │   DATABASE   │
│              │     HTTP Response     │   (server.js)     │                   │  (db.json)   │
│ • HTML pages │                       │                   │                   │              │
│ • CSS styles │                       │ • Routes          │                   │ • users[]    │
│ • JavaScript │                       │ • Middleware      │                   │ • progress[] │
│   (script.js)│                       │ • Session mgmt    │                   │              │
└──────────────┘                       └──────────────────┘                   └──────────────┘
```

This is a **full-stack web application** with three main layers:

- **Frontend (Client-Side):** HTML, CSS, and JavaScript that run in the user's browser
- **Backend (Server-Side):** Node.js + Express server that processes requests
- **Database:** JSON file that stores user data and learning progress

---

## 2. Technologies Used

| Technology | Role | Where |
|---|---|---|
| **HTML** | Page structure — what the user sees | `index.html`, `login.html`, `register.html`, `dashboard.html`, etc. |
| **CSS** | Visual styling — colors, layout, animations | `CSS/style.css` |
| **JavaScript (Browser)** | User interactions, form handling, API calls | `js/script.js` |
| **Node.js** | Runtime engine that executes the server | Runs `server.js` |
| **Express.js** | Web framework for routing and middleware | `node_modules/express` |
| **express-session** | Tracks logged-in users via session cookies | `node_modules/express-session` |
| **bcryptjs** | Password hashing for security | `node_modules/bcryptjs` |
| **JSON File** | Simple file-based database | `data/db.json` |

### Why These Technologies?

- **Node.js + Express:** JavaScript everywhere (frontend and backend use the same language)
- **bcryptjs:** Pure JavaScript password hashing (no compilation needed)
- **JSON file database:** Simple, no external database server required, perfect for learning
- **express-session:** Industry-standard session management

---

## 3. Project File Structure

```
Digital bridges/
│
├── server.js                  ← Express server (backend entry point)
├── package.json               ← Project dependencies and scripts
│
├── data/
│   └── db.json                ← Database (users and progress data)
│
├── index.html                 ← Home page
├── about.html                 ← About page
├── learning.html              ← Training modules page
├── contact.html               ← Contact form page
├── login.html                 ← Login page
├── register.html              ← Registration page
├── dashboard.html             ← User dashboard (protected)
│
├── CSS/
│   └── style.css              ← All styling
│
├── js/
│   └── script.js              ← All client-side JavaScript
│
├── node_modules/              ← Installed packages (express, bcryptjs, etc.)
│
└── assets/
    ├── icons/
    └── images/
```

---

## 4. How the Server Works

The server is defined in `server.js`. Here's what it does:

### 4.1 Server Startup

```javascript
const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`);
});
```

When you run `node server.js`, the server starts listening on port 3000 for incoming HTTP requests.

### 4.2 Middleware Stack

Middleware functions run on EVERY request before the route handler:

```javascript
app.use(express.json());           // Parses JSON request bodies
app.use(express.urlencoded());     // Parses form-encoded bodies
app.use(session({ ... }));        // Manages user sessions
app.use((req, res, next) => {     // Custom middleware: loads user from session
  if (req.session.userId) {
    const user = db.users.find(u => u.id === req.session.userId);
    res.locals.user = user;       // Makes user available to all routes
  }
  next();
});
```

### 4.3 Two Types of Routes

**Page Routes** — Serve HTML pages with dynamic auth state:
```
GET /                → index.html (home page)
GET /about.html      → about.html
GET /learning.html   → learning.html
GET /contact.html    → contact.html
GET /login.html      → login.html
GET /register.html   → register.html
GET /dashboard.html  → dashboard.html (with user data injected)
```

**API Routes** — Handle data operations (return JSON):
```
POST   /api/register        → Create new user account
POST   /api/login           → Authenticate user
POST   /api/logout          → End user session
GET    /api/user            → Get current user info
PUT    /api/user/profile    → Update profile or change password
GET    /api/user/progress   → Get module progress data
POST   /api/user/progress   → Update module progress
```

### 4.4 Static File Serving

```javascript
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
```

When the browser requests `/CSS/style.css`, Express serves the file directly without running any route handlers.

### 4.5 Auth Middleware (Route Protection)

```javascript
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please login to continue.' });
  }
  next();
}
```

API routes like `/api/user/progress` use this middleware. If no session exists, the server returns a 401 Unauthorized error.

---

## 5. How the Database Works

The database is a simple JSON file at `data/db.json`:

```json
{
  "users": [
    {
      "id": "m1abc12345",
      "name": "John Banda",
      "email": "john@test.com",
      "password": "$2a$10$N9qo8uLOickgx2ZMRZoMye...",
      "role": "learner",
      "createdAt": "2026-09-02T12:00:00.000Z"
    }
  ],
  "progress": [
    {
      "userId": "m1abc12345",
      "moduleId": 3,
      "status": "completed",
      "updatedAt": "2026-09-02T12:05:00.000Z"
    }
  ]
}
```

### Database Operations

**Load (Read):**
```javascript
function loadDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
```

**Save (Write):**
```javascript
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
```

Every time data changes (new user, progress update, profile edit), the server:
1. Loads the current database from disk
2. Modifies the JavaScript object in memory
3. Writes the entire object back to disk as formatted JSON

### Why JSON File Instead of a Real Database?

- No external database server needed (no MySQL, PostgreSQL, MongoDB to install)
- Easy to understand — you can open `db.json` and read the data
- Perfect for learning and small projects
- Can be upgraded to SQLite or PostgreSQL later without changing the API

---

## 6. How Sessions Work

Sessions are the mechanism that lets the server remember who is logged in across multiple page requests.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION FLOW                                  │
│                                                                 │
│  1. User logs in                                                │
│  2. Server creates session object: { userId: "m1abc12345" }     │
│  3. Server sends cookie: Set-Cookie: connect.sid=abc123...      │
│  4. Browser stores the cookie                                   │
│  5. Every subsequent request automatically includes the cookie  │
│  6. Server reads cookie → finds session → knows who the user is │
│  7. On logout, session is destroyed and cookie invalidated      │
└─────────────────────────────────────────────────────────────────┘
```

### Session Configuration (server.js lines 33-38)

```javascript
app.use(session({
  secret: 'digital-bridges-zambia-secret-key-2026',  // Cryptographic key to sign cookies
  resave: false,                  // Don't save session if unmodified
  saveUninitialized: false,       // Don't create session until data is stored
  cookie: { maxAge: 24 * 60 * 60 * 1000 }  // Cookie expires after 24 hours
}));
```

### How It Works Step by Step

1. **Login:** Server sets `req.session.userId = user.id`
2. **Express-session** creates a session store entry and generates a session ID
3. **Response** includes `Set-Cookie: connect.sid=s%3Aabc123...` header
4. **Browser** stores this cookie
5. **Next request:** Browser sends `Cookie: connect.sid=s%3Aabc123...` automatically
6. **Express-session** reads the cookie, looks up the session, and populates `req.session`
7. **Route handlers** can check `req.session.userId` to know who the user is

---

## 7. Complete Flow: Registration (Sign Up)

This is what happens step by step when a user fills out the registration form and clicks "Create Account":

### Step 1: Browser Loads the Register Page

```
User types: http://localhost:3000/register.html
Browser sends: GET /register.html
Express server receives the request (server.js lines 68-110)
```

The server:
1. Reads `register.html` from disk
2. Checks if user is logged in (via session cookie)
3. Injects "Login" + "Sign Up" buttons into the navbar (since user is not logged in)
4. Sends the modified HTML back to the browser

### Step 2: Browser Renders the Page

The browser receives the HTML and:
1. **Parses** the HTML structure into a DOM tree
2. **Downloads and applies** `CSS/style.css` (styling)
3. **Downloads and executes** `js/script.js` (behavior)

In `script.js`, this code activates the registration form listener:

```javascript
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();  // ← STOPS the browser from refreshing the page
    // ... validation and API call
  });
}
```

The `e.preventDefault()` is critical — it stops the default form submission (which would refresh the page) and lets JavaScript handle everything.

### Step 3: User Fills Form and Clicks Submit

User enters:
- Name: "John Banda"
- Email: "john@test.com"
- Password: "123456"
- Confirm Password: "123456"

### Step 4: Client-Side Validation

Before sending anything to the server, JavaScript validates the input:

```javascript
if (!name.value || name.value.trim().length < 2) {
  showToast('Please enter your full name.', 'error');
  return;
}
if (!email.value || !email.value.includes('@')) {
  showToast('Please enter a valid email.', 'error');
  return;
}
if (!pw.value || pw.value.length < 6) {
  showToast('Password must be at least 6 characters.', 'error');
  return;
}
if (pw.value !== confirmPw.value) {
  showToast('Passwords do not match.', 'error');
  return;
}
```

If any check fails, an error toast appears and the request is NOT sent.

### Step 5: JavaScript Sends HTTP Request to API

```javascript
const res = await fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Banda',
    email: 'john@test.com',
    password: '123456'
  })
});
```

The HTTP request looks like this:

```
POST /api/register HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"name":"John Banda","email":"john@test.com","password":"123456"}
```

### Step 6: Express Receives and Parses the Request

Middleware processes the request before the route handler:

1. **`express.json()`** parses the JSON body → `req.body` becomes `{ name: 'John Banda', ... }`
2. **`express-session`** reads any session cookie (none yet for new users)

Then the route handler at `app.post('/api/register', ...)` takes over.

### Step 7: Server-Side Validation

```javascript
if (!name || name.trim().length < 2) {
  return res.status(400).json({ success: false, message: '...' });
}
// ... more checks
```

This is server-side validation — even if someone bypasses the JavaScript validation (e.g., using curl), the server still checks.

### Step 8: Server Checks for Duplicate Email

```javascript
if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
  return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
}
```

### Step 9: Server Hashes the Password

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

The plaintext password "123456" becomes something like:
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIhZf0RLWm1PjERgHs4qbEW1WgQqRs6
```

This is **irreversible** — even if someone steals the database, they cannot recover the original passwords. The `10` means 10 rounds of salting and hashing (about 100ms of computation).

### Step 10: Server Creates User and Writes to Database

```javascript
const newUser = {
  id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
  name: 'John Banda',
  email: 'john@test.com',
  password: '$2a$10$N9qo8uLOickgx2ZMRZoMye...',  // hashed, NOT plaintext
  role: 'learner',
  createdAt: '2026-09-02T12:00:00.000Z'
};

db.users.push(newUser);
saveDB(db);  // Writes entire database to data/db.json
```

### Step 11: Server Creates Session

```javascript
req.session.userId = newUser.id;
```

This tells express-session to create a session and send a session cookie.

### Step 12: Server Sends JSON Response

```javascript
res.json({
  success: true,
  message: 'Registration successful!',
  user: { id: 'm1abc12345', name: 'John Banda', email: 'john@test.com', role: 'learner' }
});
```

The HTTP response includes:
```
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: connect.sid=s%3Aabc123.xyz456; Path=/; HttpOnly

{"success":true,"message":"Registration successful!","user":{...}}
```

### Step 13: Browser Processes the Response

```javascript
const data = await res.json();

if (data.success) {
  showToast(data.message, 'success');  // Green toast: "Registration successful!"
  setTimeout(() => location.href = '/dashboard.html', 1000);  // Redirect after 1 second
}
```

### Step 14: Browser Redirects to Dashboard

The browser sends `GET /dashboard.html` with the new session cookie. The server sees the session, loads the user data, and injects it into the HTML:

```javascript
html = html.replace('</head>',
  `<script>
    window.__USER__ = { id:'m1abc12345', name:'John Banda', ... };
    window.__PROGRESS__ = [];
  </script></head>`);
```

### Step 15: Dashboard Renders

`script.js` detects `window.__USER__` and:
- Sets the greeting: "Welcome back, John Banda!"
- Fills the profile form fields
- Builds 8 module progress cards
- Calculates and displays stats

---

## 8. Complete Flow: Login

### The Process

1. User enters email + password on login page
2. JavaScript validates input (client-side)
3. `fetch()` sends `POST /api/login` with `{ email, password }`
4. Server finds user by email in database
5. **Key difference from registration:** Server compares password with stored hash

```javascript
// Server-side password verification (server.js line 207)
const validPassword = await bcrypt.compare(password, user.password);
```

`bcrypt.compare()` takes the plaintext password the user typed and the stored hash, and checks if they match. It's deliberately slow (~100ms) to resist brute-force attacks.

6. If match → create session, send success response
7. If no match → send 401 error with "Invalid email or password"
8. Browser redirects to dashboard on success

### Security Note

The server sends the SAME error message for wrong email and wrong password: "Invalid email or password." This prevents attackers from figuring out which emails exist in the system.

---

## 9. Complete Flow: Tracking Module Progress

When a logged-in user clicks "Completed" on Module 3:

### Step 1: Click Event Fires

```javascript
container.addEventListener('click', async e => {
  const btn = e.target.closest('.progress-btn');
  const moduleId = parseInt(btn.dataset.module);  // 3
  const status = btn.dataset.status;               // "completed"

  const res = await fetch('/api/user/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleId: 3, status: 'completed' })
  });
});
```

### Step 2: Server Checks Authentication

The `requireAuth` middleware verifies the session cookie exists and is valid.

### Step 3: Server Updates Database

```javascript
db.progress.push({
  userId: req.session.userId,
  moduleId: 3,
  status: 'completed',
  updatedAt: '2026-09-02T12:05:00.000Z'
});
saveDB(db);
```

### Step 4: Page Reloads

```javascript
location.reload();  // Refreshes, server sends updated progress data
```

The dashboard re-renders with updated stats (e.g., "1 Completed, 0 In Progress, 7 Not Started, 12%").

---

## 10. Complete Flow: Logout

### Step 1: User Clicks "Logout" in Navbar

```javascript
document.querySelectorAll('#logoutBtn').forEach(btn => {
  btn.addEventListener('click', async e => {
    e.preventDefault();
    await fetch('/api/logout', { method: 'POST' });
    showToast('Logged out successfully.', 'success');
    setTimeout(() => location.href = '/index.html', 800);
  });
});
```

### Step 2: Server Destroys Session

```javascript
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});
```

The session is deleted from server memory and the cookie becomes invalid.

### Step 3: Browser Redirects to Home

The home page now shows "Login" + "Sign Up" in the navbar instead of "Dashboard" + "Logout".

---

## 11. Complete Flow: Editing Profile

### The Process

1. User changes name or email fields on dashboard
2. Clicks "Update Profile"
3. JavaScript sends `PUT /api/user/profile` with `{ name, email }`
4. Server validates, checks for duplicate email
5. Updates user record in database
6. Sends back updated user data
7. Toast notification shows success/error

### Key Code (script.js lines 242-266)

```javascript
profileForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('profileName').value.trim();
  const email = document.getElementById('profileEmail').value.trim();

  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  });
  const data = await res.json();
  showToast(data.message, data.success ? 'success' : 'error');
});
```

---

## 12. Complete Flow: Changing Password

### The Process

1. User enters current password + new password + confirm new password
2. JavaScript validates (length, match)
3. Sends `PUT /api/user/profile` with `{ currentPassword, newPassword }`
4. Server verifies current password using `bcrypt.compare()`
5. If correct → hashes new password → saves to database
6. If incorrect → returns error "Current password is incorrect"

### Server-Side (server.js lines 277-285)

```javascript
if (newPassword && newPassword.length >= 6) {
  if (!currentPassword) {
    return res.status(400).json({ success: false, message: 'Current password is required.' });
  }
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }
  user.password = await bcrypt.hash(newPassword, 10);
}
```

---

## 13. How the Frontend and Backend Communicate

### The fetch() API

All communication between browser and server uses the `fetch()` function in `script.js`:

```javascript
const res = await fetch('/api/login', {
  method: 'POST',                              // HTTP method
  headers: { 'Content-Type': 'application/json' },  // Tell server we're sending JSON
  body: JSON.stringify({ email, password })     // The data
});

const data = await res.json();  // Parse the JSON response
```

### HTTP Methods Used

| Method | Purpose | Example |
|---|---|---|
| **GET** | Retrieve data | Load a page, get user info |
| **POST** | Create/send data | Register, login, update progress |
| **PUT** | Update existing data | Edit profile, change password |

### JSON: The Common Language

Both frontend and backend communicate using JSON (JavaScript Object Notation):

**Request (Browser → Server):**
```json
{
  "email": "john@test.com",
  "password": "123456"
}
```

**Response (Server → Browser):**
```json
{
  "success": true,
  "message": "Login successful!",
  "user": { "id": "m1abc12345", "name": "John", "email": "john@test.com", "role": "learner" }
}
```

### Dynamic Navbar Injection

When serving any HTML page, the server checks the session and replaces `<!--AUTH_NAV-->` with the appropriate navbar items:

- **Not logged in:** Shows "Login" + "Sign Up" buttons
- **Logged in:** Shows "Dashboard" + "Logout" buttons

This happens on the server BEFORE the HTML is sent to the browser.

---

## 14. Security Measures

### 14.1 Password Hashing
- All passwords are hashed with bcrypt (salt rounds: 10)
- Plaintext passwords are NEVER stored in the database
- Hashing is one-way: cannot be reversed

### 14.2 Session Management
- Sessions are stored server-side (not in the browser)
- Browser only receives a signed session ID cookie
- Cookie is marked `HttpOnly` (JavaScript cannot read it)
- Sessions expire after 24 hours

### 14.3 Server-Side Validation
- All inputs are validated on the server (not just client-side)
- Email format, password length, name length are all checked server-side
- This prevents malicious users from bypassing client-side validation

### 14.4 Route Protection
- Sensitive API routes use `requireAuth` middleware
- Unauthenticated requests receive 401 Unauthorized
- Dashboard data is only served to logged-in users

### 14.5 No Sensitive Data in Responses
- Login/register responses never include the password hash
- Only `id`, `name`, `email`, and `role` are sent to the browser

---

## 15. Full Request Lifecycle Summary

```
 1. USER clicks a button or submits a form
          │
 2. BROWSER JavaScript catches the event (event listener in script.js)
          │
 3. JAVASCRIPT validates input (client-side checks)
          │
 4. FETCH() sends HTTP request to server (JSON body + session cookie)
          │
 5. EXPRESS receives the request (matched by route: POST /api/login, etc.)
          │
 6. MIDDLEWARE processes it (parse JSON, check session, authenticate)
          │
 7. ROUTE HANDLER runs business logic (validate, hash password, etc.)
          │
 8. DATABASE is read/modified (loadDB() → modify → saveDB() → db.json)
          │
 9. SERVER sends JSON response (success/error + data)
          │
10. BROWSER receives the response (res.json())
          │
11. JAVASCRIPT updates the UI (show toast, redirect, update DOM)
          │
12. USER sees the result (page changes, toast appears, redirect happens)
```

---

## 16. How to Run the Project

### Prerequisites
- **Node.js** (v16 or higher) must be installed

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```
   This reads `package.json` and installs express, express-session, and bcryptjs into `node_modules/`.

2. **Start the server:**
   ```bash
   node server.js
   ```
   You should see: `Digital Bridges Zambia Server — Running at http://localhost:3000`

3. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

4. **Try it out:**
   - Click "Sign Up" to create an account
   - You'll be redirected to your Dashboard
   - Click module status buttons to track your learning progress
   - Edit your profile or change your password
   - Click "Logout" and try logging back in

### Database Location
The database file is created automatically at `data/db.json`. You can open it to see all registered users and their progress.

### Stopping the Server
Press `Ctrl+C` in the terminal where the server is running.

---

---

## 17. Complete Application Map

### 17.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Client)                                │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ index    │  │ login    │  │ register │  │ dashboard│  │ contact      │  │
│  │ .html    │  │ .html    │  │ .html    │  │ .html    │  │ .html        │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │              │              │               │         │
│       └──────────────┴──────────────┴──────────────┴───────────────┘         │
│                              │                                               │
│                    js/script.js (378 lines)                                  │
│         Handles ALL user interactions + API calls via fetch()               │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │  HTTP Requests (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER (server.js)                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │ MIDDLEWARE CHAIN (runs on every request)                            │     │
│  │  express.json() → session() → user loader → route handler          │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌──────────── PAGE ROUTES ────────────┐  ┌──────── API ROUTES ────────┐    │
│  │ GET /            → index.html       │  │ POST /api/register         │    │
│  │ GET /about.html  → about.html       │  │ POST /api/login            │    │
│  │ GET /learning.html → learning.html  │  │ POST /api/logout           │    │
│  │ GET /contact.html → contact.html    │  │ GET  /api/user             │    │
│  │ GET /login.html  → login.html       │  │ PUT  /api/user/profile     │    │
│  │ GET /register.html → register.html  │  │ GET  /api/user/progress    │    │
│  │ GET /dashboard.html → dashboard.html│  │ POST /api/user/progress    │    │
│  └─────────────────────────────────────┘  │ POST /api/contact          │    │
│                                           └────────────────────────────┘    │
│  ┌── STATIC FILES ──┐  ┌── DOWNLOAD ───────────────────────────────┐       │
│  │ /CSS/*           │  │ GET /download/documentation                │       │
│  │ /js/*            │  └───────────────────────────────────────────┘       │
│  │ /assets/*        │                                                       │
│  └──────────────────┘                                                       │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │  Read/Write
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE (data/db.json)                             │
│                                                                             │
│  {                                                                          │
│    "users": [ { id, name, email, password(hashed), role, createdAt } ],     │
│    "progress": [ { userId, moduleId(1-8), status, updatedAt } ],            │
│    "messages": [ { id, name, email, subject, message, createdAt } ]         │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 17.2 All Routes Reference

**Page Routes (serve HTML):**

| Route | File | Description | Auth Required |
|-------|------|-------------|---------------|
| `GET /` | index.html | Home page with hero, modules, beneficiaries | No |
| `GET /about.html` | about.html | About the organization | No |
| `GET /learning.html` | learning.html | All 8 training modules with details | No |
| `GET /contact.html` | contact.html | Contact form + contact details | No |
| `GET /login.html` | login.html | Login form | No |
| `GET /register.html` | register.html | Registration form | No |
| `GET /dashboard.html` | dashboard.html | User dashboard with progress tracking | Yes (session) |

**API Routes (return JSON):**

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `POST` | `/api/register` | Create new user account | No |
| `POST` | `/api/login` | Authenticate user and create session | No |
| `POST` | `/api/logout` | Destroy session and log out | No |
| `GET` | `/api/user` | Get current logged-in user info | Yes |
| `PUT` | `/api/user/profile` | Update name, email, or password | Yes |
| `GET` | `/api/user/progress` | Get all module progress for user | Yes |
| `POST` | `/api/user/progress` | Update a module's status | Yes |
| `POST` | `/api/contact` | Submit contact form (saves + emails) | No |
| `GET` | `/download/documentation` | Download this documentation file | No |

### 17.3 Database Schema (data/db.json)

**users[]** — Stores registered user accounts:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID (timestamp + random) |
| `name` | string | User's full name |
| `email` | string | Email address (lowercase, unique) |
| `password` | string | bcrypt hash (10 salt rounds) |
| `role` | string | Always "learner" |
| `createdAt` | string | ISO date when account was created |

**progress[]** — Tracks module completion per user:

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Links to user's id |
| `moduleId` | number | 1–8 (which training module) |
| `status` | string | "not_started", "in_progress", or "completed" |
| `updatedAt` | string | ISO date of last status change |

**messages[]** — Stores contact form submissions:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique message ID |
| `name` | string | Sender's name |
| `email` | string | Sender's email |
| `subject` | string | Selected topic (partnership, training, etc.) |
| `message` | string | Message content |
| `createdAt` | string | ISO date of submission |

### 17.4 Feature Flow Diagrams

**Registration:**
```
Form → Validate → POST /api/register → Hash password → Save to db.json → Create session → Redirect to dashboard
```

**Login:**
```
Form → Validate → POST /api/login → Find user by email → bcrypt.compare → Create session → Redirect to dashboard
```

**Logout:**
```
Click Logout → POST /api/logout → Destroy session → Redirect to /
```

**Progress Tracking:**
```
Click status button → POST /api/user/progress → Update db.json → Reload page → Recalculate stats
```

**Profile Edit:**
```
Edit name/email → PUT /api/user/profile → Validate → Update db.json → Show toast
```

**Password Change:**
```
Enter current + new → PUT /api/user/profile → Verify current → Hash new → Update db.json → Show toast
```

**Contact Form:**
```
Fill form → POST /api/contact → Validate → Save to db.json → Send email via Gmail SMTP → Show toast
```

**Documentation Download:**
```
Visit /download/documentation → Express serves DOCUMENTATION.md as file download
```

---

## 18. Step-by-Step Creation Guide: How This Site Was Built

This section explains every step taken to create the Digital Bridges Zambia website from scratch.

### Phase 1: Static Frontend (HTML + CSS + JavaScript)

**What was done:** Created the visual website that users see in their browser.

1. **Created `index.html`** — The home page with:
   - Navigation bar with logo, links, and auth placeholder (`<!--AUTH_NAV-->`)
   - Hero section with headline, description, and call-to-action buttons
   - Stats bar (8 modules, 30+ topics, 4 phases, 7+ target groups)
   - Training modules preview grid (6 cards)
   - Target beneficiaries section (6 audience cards)
   - Footer with links and branding

2. **Created `about.html`** — Organization background, mission, approach, and implementation phases

3. **Created `learning.html`** — All 8 training modules with expandable detail accordions:
   - Module 1: Introduction to Digital Literacy
   - Module 2: Online Safety & Cyber Hygiene
   - Module 3: Digital Communication & Collaboration
   - Module 4: Information & Media Literacy
   - Module 5: Digital Financial Literacy
   - Module 6: Productivity & Work Readiness
   - Module 7: Digital Entrepreneurship
   - Module 8: Responsible Digital Citizenship

4. **Created `contact.html`** — Contact information (location, email, phone, office hours) + contact form with name, email, subject dropdown, and message textarea

5. **Created `login.html`** — Login form with email, password, password toggle, remember me checkbox

6. **Created `CSS/style.css`** — Complete styling with:
   - CSS custom properties (design tokens) for colors: navy blue primary, blue accent
   - Responsive layout (mobile-first with media queries)
   - Card-based module grids
   - Form styling with input icons and password toggle
   - Toast notification system
   - Scroll animations (fade-in-up on intersection)
   - Hamburger mobile menu
   - Footer and stats bar styling

7. **Created `js/script.js`** — Client-side interactivity:
   - Navbar scroll effect (adds shadow on scroll)
   - Mobile hamburger menu toggle
   - Password visibility toggle (eye icon)
   - Toast notification function
   - Scroll-triggered animations (IntersectionObserver)
   - Animated stats counter
   - Module accordion (learning page)

### Phase 2: Backend Server Setup

**What was done:** Built the Node.js + Express server to handle dynamic requests.

8. **Initialized Node.js project:**
   ```bash
   npm init -y
   ```
   Created `package.json` with project metadata and scripts.

9. **Installed dependencies:**
   ```bash
   npm install express express-session bcryptjs
   ```
   - `express` — Web framework for routing and middleware
   - `express-session` — Session management for authentication
   - `bcryptjs` — Password hashing (pure JavaScript, no compilation needed)

   **Note:** Initially tried `better-sqlite3` for the database, but it required native C++ compilation (Python + node-gyp) which wasn't available. Switched to a JSON file database instead — simpler and dependency-free.

10. **Created `server.js`** — The Express backend:
    - Set up Express app on port 3000
    - Configured middleware stack:
      - `express.json()` — Parses JSON request bodies
      - `express.urlencoded()` — Parses form-encoded bodies
      - `express-session()` — Manages user sessions with 24-hour cookie expiry
    - Created custom middleware to load user from session on every request
    - Set up static file serving for `/CSS`, `/js`, `/assets`

11. **Built page routing system:**
    - Created a `pages` array: `['index', 'about', 'learning', 'contact', 'login', 'register', 'dashboard']`
    - Each page is served with dynamic auth context — the server reads the HTML file, checks the session, and replaces `<!--AUTH_NAV-->` placeholders with either Login/Sign Up or Dashboard/Logout buttons
    - The dashboard page additionally injects `window.__USER__` and `window.__PROGRESS__` data via a script tag

### Phase 3: Database Layer

**What was done:** Created a simple file-based database for storing users and progress.

12. **Designed the database schema:**
    ```json
    { "users": [], "progress": [], "messages": [] }
    ```

13. **Implemented database functions:**
    - `ensureDataDir()` — Creates `data/` folder and `db.json` if they don't exist
    - `loadDB()` — Reads and parses `db.json` from disk
    - `saveDB(db)` — Writes the database object back to `db.json` with pretty formatting

14. **How it works:** Every time data changes, the server loads the entire JSON file into memory, modifies the JavaScript object, then writes it all back to disk. This is simple and works well for small-to-medium projects.

### Phase 4: Authentication System

**What was done:** Built registration, login, and logout with secure password handling.

15. **Created `POST /api/register`:**
    - Validates name (≥2 chars), email (contains @ and .), password (≥6 chars)
    - Checks for duplicate email in database
    - Hashes password with `bcrypt.hash(password, 10)` — 10 salt rounds
    - Creates user object with unique ID, stores in database
    - Sets `req.session.userId` to create an authenticated session
    - Returns success JSON with user data (never includes password)

16. **Created `POST /api/login`:**
    - Finds user by email (case-insensitive)
    - Verifies password with `bcrypt.compare(plaintext, hash)`
    - Returns same error message for wrong email AND wrong password (prevents email enumeration)
    - Creates session on success

17. **Created `POST /api/logout`:**
    - Destroys the session with `req.session.destroy()`
    - Clears the session cookie
    - Returns success JSON

18. **Created `requireAuth` middleware:**
    - Checks if `req.session.userId` exists
    - Returns 401 Unauthorized if not logged in
    - Applied to all protected API routes

### Phase 5: Frontend-Backend Integration

**What was done:** Connected the HTML forms to the API endpoints.

19. **Updated `js/script.js`** with API integration:
    - **Login form:** Added `fetch('/api/login', { method: 'POST', ... })` with JSON body
    - **Register form:** Added `fetch('/api/register', { method: 'POST', ... })` with validation
    - **Logout button:** Added `fetch('/api/logout', { method: 'POST' })` with redirect
    - All forms use `e.preventDefault()` to stop default browser submission
    - Added loading states (button text changes to "Signing in..." etc.)
    - Added error handling with try/catch and toast notifications

20. **Created `register.html`:**
    - Full name, email, password, confirm password fields
    - SVG icons in input fields
    - Password visibility toggle
    - Link to login page for existing users

21. **Implemented dynamic navbar:**
    - Added `<!--AUTH_NAV-->` and `<!--AUTH_NAV_MOBILE-->` placeholders to all HTML pages
    - Server replaces these based on session state:
      - **Not logged in:** Login + Sign Up buttons
      - **Logged in:** Dashboard + Logout buttons

### Phase 6: User Dashboard

**What was done:** Built the authenticated user dashboard with progress tracking.

22. **Created `dashboard.html`:**
    - Greeting section ("Welcome back, [Name]!")
    - Stats overview bar (completed, in progress, not started, percentage)
    - 8 training module cards with status buttons
    - Profile settings form (name, email)
    - Password change form (current, new, confirm)
    - Account info (member since date, role)

23. **Built progress tracking API:**
    - `GET /api/user/progress` — Returns all progress records for the logged-in user
    - `POST /api/user/progress` — Creates or updates a module's status
    - Valid statuses: "not_started", "in_progress", "completed"
    - Valid module IDs: 1–8

24. **Built profile management API:**
    - `PUT /api/user/profile` — Updates name and/or email
    - Checks for duplicate email before updating
    - `PUT /api/user/profile` with `currentPassword` + `newPassword` — Changes password
    - Verifies current password before allowing change

25. **Dashboard rendering in `script.js`:**
    - Detects `window.__USER__` (injected by server)
    - Populates greeting, profile fields, member info
    - Dynamically builds 8 module cards with colored status buttons
    - Calculates stats (completed count, percentage)
    - Handles progress button clicks → API call → page reload

### Phase 7: Contact Form & Email

**What was done:** Made the contact form functional with real email delivery.

26. **Updated contact form in `script.js`:**
    - Was previously faking submission with `setTimeout`
    - Changed to real `fetch('/api/contact', { method: 'POST', ... })`
    - Added proper error handling and loading states

27. **Created `POST /api/contact` endpoint:**
    - Validates name, email, subject, message (≥10 chars)
    - Saves message to `db.json` under `messages[]`
    - Sends email notification via Nodemailer

28. **Installed and configured Nodemailer:**
    ```bash
    npm install nodemailer
    ```
    - Configured Gmail SMTP transport
    - Uses Gmail App Password for authentication (16-char password from Google Account settings)
    - Sends formatted HTML email with sender name, email, subject, and message
    - Email is sent to the site administrator
    - Falls back gracefully if email is not configured (still saves to database)

### Phase 8: Documentation & Download Feature

**What was done:** Created comprehensive documentation and made it downloadable.

29. **Created `DOCUMENTATION.md`** (this file) — 800+ lines covering:
    - Architecture overview with diagrams
    - Complete technology stack explanation
    - File structure map
    - Server, database, and session deep dives
    - Step-by-step walkthroughs of every feature flow
    - Security measures
    - Full request lifecycle summary

30. **Added download route:**
    ```javascript
    app.get('/download/documentation', (req, res) => {
      res.download(filePath, 'Digital_Bridges_Zambia_Documentation.md');
    });
    ```
    Visiting `http://localhost:3000/download/documentation` triggers a file download.

### Phase 9: Bug Fixes & Improvements

**What was done:** Fixed issues discovered during testing.

31. **Fixed `better-sqlite3` compilation failure:**
    - Problem: `npm install better-sqlite3` failed because it requires Python and C++ build tools (node-gyp)
    - Solution: Removed better-sqlite3 entirely, switched to pure JavaScript JSON file database
    - Lesson: Always prefer pure JS packages when native compilation tools aren't available

32. **Fixed `innerHTML` security issue:**
    - Problem: Password toggle used `svg.innerHTML = '...'` to swap eye icons — flagged as XSS risk
    - Solution: Replaced with safe DOM methods using `createElementNS` and `appendChild`

33. **Fixed logout redirect:**
    - Problem: Logout redirected to `/index.html` which returned "Cannot GET /index.html"
    - Cause: Server serves homepage at `/` not `/index.html`
    - Solution: Changed redirect to `/`

34. **Fixed port conflict (EADDRINUSE):**
    - Problem: "address already in use :::3000" when restarting server
    - Cause: Previous Node.js process was still running
    - Solution: Kill existing Node processes before starting: `Get-Process -Name "node" | Stop-Process -Force`

35. **Fixed contact details:**
    - Updated email, phone number, and location in `contact.html` to reflect actual organization details

---

## 19. Complete API Reference

### POST /api/register

**Purpose:** Create a new user account

**Request:**
```json
{
  "name": "John Banda",
  "email": "john@test.com",
  "password": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration successful!",
  "user": { "id": "m1abc12345", "name": "John Banda", "email": "john@test.com", "role": "learner" }
}
```

**Error Responses:**
- `400` — Validation failed (name too short, invalid email, password < 6 chars, duplicate email)
- `500` — Server error

---

### POST /api/login

**Purpose:** Authenticate user and create session

**Request:**
```json
{
  "email": "john@test.com",
  "password": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful!",
  "user": { "id": "m1abc12345", "name": "John Banda", "email": "john@test.com", "role": "learner" }
}
```

**Error Responses:**
- `400` — Missing email or password
- `401` — Invalid email or password (same message for both to prevent enumeration)

---

### POST /api/logout

**Purpose:** Destroy session and log out

**Request:** No body needed

**Success Response (200):**
```json
{ "success": true, "message": "Logged out successfully." }
```

---

### GET /api/user

**Purpose:** Get current logged-in user's info

**Auth:** Required (session cookie)

**Success Response (200):**
```json
{
  "success": true,
  "user": { "id": "m1abc12345", "name": "John Banda", "email": "john@test.com", "role": "learner", "joined": "2026-09-02T12:00:00.000Z" }
}
```

**Error Responses:**
- `401` — Not logged in
- `404` — User not found in database

---

### PUT /api/user/profile

**Purpose:** Update profile info or change password

**Auth:** Required

**Request (update name/email):**
```json
{ "name": "John M. Banda", "email": "john.new@test.com" }
```

**Request (change password):**
```json
{ "currentPassword": "123456", "newPassword": "newpass789" }
```

**Success Response (200):**
```json
{ "success": true, "message": "Profile updated successfully.", "user": { ... } }
```

**Error Responses:**
- `400` — Email already in use, current password required, current password incorrect
- `401` — Not logged in
- `404` — User not found

---

### GET /api/user/progress

**Purpose:** Get all module progress for current user

**Auth:** Required

**Success Response (200):**
```json
{
  "success": true,
  "progress": [
    { "userId": "m1abc12345", "moduleId": 3, "status": "completed", "updatedAt": "2026-09-02T12:05:00.000Z" }
  ]
}
```

---

### POST /api/user/progress

**Purpose:** Update a module's progress status

**Auth:** Required

**Request:**
```json
{ "moduleId": 3, "status": "completed" }
```

Valid statuses: `"not_started"`, `"in_progress"`, `"completed"`
Valid module IDs: `1` through `8`

**Success Response (200):**
```json
{ "success": true, "message": "Progress updated." }
```

**Error Responses:**
- `400` — Invalid module ID or status
- `401` — Not logged in

---

### POST /api/contact

**Purpose:** Submit contact form message

**Request:**
```json
{
  "name": "Jane Phiri",
  "email": "jane@test.com",
  "subject": "partnership",
  "message": "We would like to partner with Digital Bridges Zambia..."
}
```

Valid subjects: `"partnership"`, `"training"`, `"facilitator"`, `"content"`, `"general"`

**Success Response (200):**
```json
{ "success": true, "message": "Message sent successfully!" }
```

**What happens:**
1. Message is validated
2. Saved to `db.json` under `messages[]`
3. Email sent to administrator via Gmail SMTP (Nodemailer)
4. Success response returned

**Error Responses:**
- `400` — Validation failed
- `500` — Server error

---

### GET /download/documentation

**Purpose:** Download this documentation file

**Response:** Triggers browser file download of `Digital_Bridges_Zambia_Documentation.md`

---

*Digital Bridges Zambia — Inclusive Digital Literacy Training Platform*
*Complete documentation with application map, creation guide, and API reference*
*Last updated: September 2026*

// ===== Auth Middleware =====
// Guards routes that require a logged-in user. `req.session.userId` is set by
// the login route and cleared by logout. Moved verbatim from server.js.
// Sibling middleware (csrf, error handlers) can live alongside this file.
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please login to continue.' });
  }
  next();
}

module.exports = { requireAuth };

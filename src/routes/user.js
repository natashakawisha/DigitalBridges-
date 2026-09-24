// ===== User & Auth API Routes =====
// Registration, login/logout, current-user, profile updates, and module
// progress. Extracted verbatim from server.js; mounted at /api.
const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');

module.exports = function createUserRouter({ loadDB, saveDB }) {
  const router = express.Router();

  // Register
  router.post('/register', async (req, res) => {
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
  router.post('/login', async (req, res) => {
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
  router.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Logout failed.' });
      }
      res.json({ success: true, message: 'Logged out successfully.' });
    });
  });

  // Get current user
  router.get('/user', requireAuth, (req, res) => {
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
  router.put('/user/profile', requireAuth, async (req, res) => {
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
  router.get('/user/progress', requireAuth, (req, res) => {
    const db = loadDB();
    const progress = db.progress.filter(p => p.userId === req.session.userId);
    res.json({ success: true, progress });
  });

  // Update module progress
  router.post('/user/progress', requireAuth, (req, res) => {
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

  return router;
};

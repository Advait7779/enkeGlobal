const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { adminEmail, adminPassword, jwtSecret } = require('../config');

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!adminEmail || !adminPassword || !jwtSecret) {
      return res.status(503).json({ error: 'Admin authentication is not configured' });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { role: 'admin', email },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({ token, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/verify
router.post('/verify', (req, res) => {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ valid: false });

  try {
    if (!jwtSecret) return res.status(503).json({ valid: false });
    const payload = jwt.verify(token, jwtSecret);
    if (payload.role !== 'admin') return res.status(403).json({ valid: false });
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;

const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function requireAdmin(req, res, next) {
  if (!jwtSecret) {
    return res.status(503).json({ error: 'Admin authentication is not configured' });
  }

  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAdmin };

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const pool = require('./db');
const { port: PORT, nodeEnv, clientOrigins, uploadDir, jwtSecret } = require('./config');

// ─── Startup Validation ───────────────────────────────────────────────────────
if (nodeEnv === 'production') {
  if (!jwtSecret || jwtSecret.length < 32) {
    console.error('❌ FATAL: JWT_SECRET must be at least 32 characters in production. Set it in your .env file.');
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1);

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  ...clientOrigins,
]);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

// Legacy catalogue images are packaged with the API. New CMS uploads live on
// persistent storage so they survive container restarts and redeployments.
app.use('/Images', express.static(path.resolve(__dirname, 'public/Images')));
app.use('/uploads', express.static(uploadDir));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});

const enquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many enquiries submitted. Please wait 10 minutes before trying again.' },
  skip: (req) => req.method !== 'POST',
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/enquiries', enquiryLimiter);
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/upload', require('./routes/upload'));

// Liveness check for Docker/Coolify. Database readiness is checked separately.
app.get('/api/health/live', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness check used to verify PostgreSQL connectivity after deployment.
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable', timestamp: new Date().toISOString() });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Server Error:', err.message);
  const message = nodeEnv === 'production' ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(500).json({ error: message });
});

const { autoInitDatabase } = require('./services/autoInit');

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`🚀 ENKEglobal API server running on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    await autoInitDatabase();
  });
}

module.exports = app;


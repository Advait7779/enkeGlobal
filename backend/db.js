const { Pool } = require('pg');
require('./config');

const useSsl = process.env.DB_SSL === 'true';
const connection = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(useSsl && { ssl: { rejectUnauthorized: false } }),
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'enkeglobal',
      ...(useSsl && { ssl: { rejectUnauthorized: false } }),
    };

const pool = new Pool(connection);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err.message);
});

module.exports = pool;

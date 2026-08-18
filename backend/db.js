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

if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
    console.log(`🔌 Database configured via DATABASE_URL -> host: ${parsed.hostname}, port: ${parsed.port || 5432}, user: ${parsed.username}, db: ${parsed.pathname.slice(1)}`);
  } catch {
    console.log('🔌 Database configured via DATABASE_URL');
  }
} else {
  console.log(`🔌 Database configured via parameters -> host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}, user: ${process.env.DB_USER || 'postgres'}, db: ${process.env.DB_NAME || 'enkeglobal'}`);
}

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

module.exports = pool;

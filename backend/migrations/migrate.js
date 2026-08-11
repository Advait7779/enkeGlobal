const fs = require('fs');
const path = require('path');
const pool = require('../db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '001_init.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Migration completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();

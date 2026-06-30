require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function query() {
  try {
    const res = await pool.query('SELECT id, type, "createdAt" FROM "LeaveRequest" ORDER BY "createdAt" DESC LIMIT 5');
    console.log('Recent Leaves:', res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
query();

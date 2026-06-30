require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function query() {
  try {
    const res = await pool.query('SELECT id, role, "isDeleted", "fcmToken" FROM "User" WHERE role = \'PRINCIPAL\'');
    console.log('Principal:', res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
query();

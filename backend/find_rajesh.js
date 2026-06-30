require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function query() {
  try {
    const res = await pool.query('SELECT * FROM "Teacher" WHERE "firstName" ILIKE \'%rajesh%\'');
    console.log('Teachers:', res.rows);
    const res2 = await pool.query('SELECT * FROM "Student" WHERE "firstName" ILIKE \'%rajesh%\'');
    console.log('Students:', res2.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
query();

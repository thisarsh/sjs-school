const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log('Running test query...');
    const result = await pool.query(
      `SELECT g.id, g.url, g."publicId", g.description, g."uploadedById", g."createdAt",
              u.email, u.role,
              CASE 
                WHEN u.role = 'TEACHER' THEN (SELECT CONCAT(t."firstName", ' ', t."lastName") FROM "Teacher" t WHERE t."userId" = u.id)
                WHEN u.role = 'PRINCIPAL' THEN 'Principal'
                WHEN u.role = 'SUPER_ADMIN' THEN 'Super Admin'
                ELSE 'Staff'
              END as "uploadedByName"
       FROM "GalleryImage" g
       LEFT JOIN "User" u ON g."uploadedById" = u.id
       ORDER BY g."createdAt" DESC`
    );
    console.log('QUERY SUCCESS:', result.rows);
  } catch (err) {
    console.error('QUERY ERROR:', err);
  } finally {
    await pool.end();
  }
}

run();

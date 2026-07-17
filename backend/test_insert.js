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
    console.log('Connecting to database...');
    const testUserRes = await pool.query('SELECT id FROM "User" LIMIT 1');
    if (testUserRes.rows.length === 0) {
      console.log('No users found in database');
      return;
    }
    const userId = testUserRes.rows[0].id;
    console.log(`Using test user ID: ${userId}`);

    console.log('Running test insert into "GalleryImage"...');
    const res = await pool.query(
      `INSERT INTO "GalleryImage" (id, url, "publicId", description, "uploadedById", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING *`,
      ['http://example.com/test.jpg', 'test_public_id', 'Test description', userId]
    );
    console.log('INSERT SUCCESS:', res.rows[0]);

    // Clean up
    console.log('Deleting test image...');
    await pool.query('DELETE FROM "GalleryImage" WHERE id = $1', [res.rows[0].id]);
    console.log('DELETE SUCCESS');

  } catch (err) {
    console.error('DATABASE ERROR:', err);
  } finally {
    await pool.end();
  }
}

run();

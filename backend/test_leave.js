const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

async function simulateLeave() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  try {
    // Find Rajesh
    const res = await pool.query(`SELECT id FROM "User" WHERE role = 'TEACHER' LIMIT 1`);
    if (res.rows.length === 0) {
      console.log('Teacher not found');
      return;
    }
    const rajeshUserId = res.rows[0].id;
    
    const token = jwt.sign(
      { userId: rajeshUserId, role: 'TEACHER' },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1h' }
    );
    
    console.log('Sending Leave Request as Rajesh to LIVE SERVER...');
    const response = await fetch('https://sjs-school.onrender.com/api/leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'Sick Leave',
        fromDate: new Date().toISOString(),
        toDate: new Date().toISOString(),
        totalDays: 1,
        reason: 'Not feeling well'
      })
    });
    
    console.log('Response Status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Response Body:', text);
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
simulateLeave();

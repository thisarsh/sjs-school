const { Pool } = require('pg');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
require('dotenv').config();

async function testPush() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
      console.error('NO ENV VARIABLE: FIREBASE_SERVICE_ACCOUNT_BASE64');
      return;
    }
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));
    
    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }

    // Get principal token
    const res = await pool.query('SELECT "fcmToken" FROM "User" WHERE role = \'PRINCIPAL\' AND "fcmToken" IS NOT NULL');
    if (res.rows.length === 0) {
      console.log('No principal with FCM token found in database.');
      return;
    }
    const tokens = res.rows.map(r => r.fcmToken);

    const message = {
      notification: { title: 'Test Notification', body: 'Hello! This is a manual test from your AI assistant.' },
      tokens: tokens,
      data: {}
    };

    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`Success: ${response.successCount}; Fail: ${response.failureCount}`);
    if (response.failureCount > 0) {
        console.log(response.responses[0].error);
    } else {
        console.log('Successfully sent push notification to Principal!');
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
testPush();

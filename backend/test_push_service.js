require('dotenv').config();
const { PushService } = require('./dist/services/push.service.js');
const pool = require('./dist/config/prisma.js').default;

async function testPushService() {
  try {
    console.log('Sending push notification using PushService...');
    await PushService.sendToPrincipals('Direct Test', 'This is using PushService directly');
    console.log('PushService finished.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
testPushService();

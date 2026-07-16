import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import pool from '../config/prisma';

// Initialize Firebase Admin
try {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountBase64) {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    console.log('Firebase Admin initialized successfully');
  } else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 is not set. Push notifications will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
}

export class PushService {
  /**
   * Sends a push notification to specific users by querying their FCM tokens
   */
  static async sendToUsers(userIds: string[], title: string, body: string, data?: any) {
    if (!getApps().length) {
      console.warn('Firebase Admin not initialized, skipping push notification');
      return;
    }

    if (!userIds || userIds.length === 0) return;

    try {
      const result = await pool.query(
        'SELECT "fcmToken" FROM "User" WHERE id = ANY($1) AND "fcmToken" IS NOT NULL',
        [userIds]
      );

      const tokens = result.rows.map(row => row.fcmToken).filter(token => !!token);

      if (tokens.length === 0) {
        console.log('No FCM tokens found for the specified users');
        return;
      }


      // Map dynamic notification channels
      let channelId = 'default';
      let actionCategory: string | undefined = undefined;
      if (data?.type === 'NOTICE') {
        channelId = 'sjs_school_notices';
        actionCategory = 'NOTICE_ACTIONS';
      } else if (data?.type === 'LEAVE_STATUS' || data?.type === 'LEAVE_REQUEST') {
        channelId = 'sjs_school_leaves';
        actionCategory = 'LEAVE_ACTIONS';
      } else if (data?.type === 'COMPLAINT_STATUS' || data?.type === 'COMPLAINT_REQUEST') {
        channelId = 'sjs_school_complaints';
        actionCategory = 'COMPLAINT_ACTIONS';
      } else if (data?.type === 'ATTENDANCE_ABSENT') {
        channelId = 'sjs_school_attendance';
        actionCategory = 'ATTENDANCE_ACTIONS';
      }

      const imageUrl = data?.imageUrl || 'https://sjs-school.vercel.app/assets/logo_small.png';

      const message: MulticastMessage = {
        notification: { 
          title, 
          body 
        },
        tokens: tokens,
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_stat_notification',   // Monochrome small notification icon
            color: '#1a73e8',                // SJS school brand blue accent color
            channelId: channelId,            // Dedicated notification channel ID
            sound: 'default',
            imageUrl: imageUrl,              // High-resolution school logo / notice banner
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              category: actionCategory,      // Native Action buttons category for iOS
              mutableContent: true,          // Always enable media download on iOS
              alert: {
                title,
                body
              }
            }
          },
          fcmOptions: {
            imageUrl: imageUrl
          }
        }
      };

      const response = await getMessaging().sendEachForMulticast(message);
      console.log(`Successfully sent ${response.successCount} messages; Failed: ${response.failureCount}`);
      return response;
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Sends a push notification to all Principals
   */
  static async sendToPrincipals(title: string, body: string, data?: any) {
    if (!getApps().length) return;

    try {
      const result = await pool.query(
        'SELECT id FROM "User" WHERE role = \'PRINCIPAL\' AND "isDeleted" = false'
      );
      const principalIds = result.rows.map(row => row.id);
      
      return await this.sendToUsers(principalIds, title, body, data);
    } catch (error: any) {
      console.error('Error sending push to principals:', error);
      throw error;
    }
  }

  /**
   * Sends a push notification to specific roles (e.g. TEACHER, STUDENT, PARENT)
   */
  static async sendToRoles(roles: string[], title: string, body: string, data?: any) {
    if (!getApps().length) return;

    try {
      const result = await pool.query(
        'SELECT id FROM "User" WHERE role = ANY($1::"Role"[]) AND "isDeleted" = false',
        [roles]
      );
      const userIds = result.rows.map(row => row.id);
      
      return await this.sendToUsers(userIds, title, body, data);
    } catch (error: any) {
      console.error('Error sending push to roles:', error);
    }
  }
}

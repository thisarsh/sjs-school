import pool from '../config/prisma';
import { PushService } from './push.service';

export class AttendanceService {
  async getTodayAttendance() {
    // Standardize to IST midnight
    const istDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const today = new Date(`${istDateStr}T00:00:00.000Z`);
    const nextDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `SELECT * FROM "Attendance" WHERE date >= $1 AND date < $2`,
      [today, nextDay]
    );

    return result.rows;
  }

  async markAttendance(attendanceData: { studentId: string, status: string }[]) {
    if (!attendanceData || attendanceData.length === 0) return [];

    // Standardize to IST midnight
    const istDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const today = new Date(`${istDateStr}T00:00:00.000Z`);

    const studentIds = attendanceData.map(r => r.studentId);
    const statuses = attendanceData.map(r => r.status);

    const res = await pool.query(
      `INSERT INTO "Attendance" (id, "studentId", date, status, "createdAt", "updatedAt")
       SELECT gen_random_uuid(), s_id, $1, stat, NOW(), NOW()
       FROM unnest($2::text[], $3::text[]) AS t(s_id, stat)
       ON CONFLICT ("studentId", date) DO UPDATE 
       SET status = EXCLUDED.status, "updatedAt" = NOW()
       RETURNING *`,
      [today, studentIds, statuses]
    );

    // Send push notification to absent students
    const absentStudentIds = attendanceData
      .filter(r => r.status === 'ABSENT')
      .map(r => r.studentId);

    if (absentStudentIds.length > 0) {
      try {
        const studentUsers = await pool.query(
          'SELECT "userId", "firstName", "lastName" FROM "Student" WHERE id = ANY($1)',
          [absentStudentIds]
        );

        for (const s of studentUsers.rows) {
          if (s.userId) {
            const formattedDate = new Date(istDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            PushService.sendToUsers(
              [s.userId],
              '🚫 Absent Today',
              `${s.firstName || ''} ${s.lastName || ''}`.trim() + ` was marked absent on ${formattedDate}. Tap to view attendance details.`,
              { type: 'ATTENDANCE_ABSENT', date: istDateStr }
            ).catch(err => console.error('Error sending absent student push:', err));
          }
        }
      } catch (err) {
        console.error('Failed to send absent push notifications:', err);
      }
    }

    return res.rows;
  }

  async getAttendanceRegister(studentIds: string[], startDate: Date, endDate: Date) {
    if (!studentIds || studentIds.length === 0) return [];
    
    const result = await pool.query(
      `SELECT * FROM "Attendance" WHERE "studentId" = ANY($1) AND date >= $2 AND date <= $3`,
      [studentIds, startDate, endDate]
    );

    return result.rows;
  }
}

import pool from '../config/prisma';

export class AttendanceService {
  async getTodayAttendance() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    const result = await pool.query(
      `SELECT * FROM "Attendance" WHERE date >= $1 AND date < $2`,
      [today, nextDay]
    );

    return result.rows;
  }

  async markAttendance(attendanceData: { studentId: string, status: string }[]) {
    if (!attendanceData || attendanceData.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import pool from '../config/prisma';

const router = Router();

router.use(authMiddleware);

router.get('/superadmin', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const studentCount = await pool.query('SELECT COUNT(*) FROM "Student" WHERE "isDeleted" = false');
    const teacherCount = await pool.query('SELECT COUNT(*) FROM "Teacher"');
    const classCount = await pool.query('SELECT COUNT(*) FROM "Class"');
    
    // Calculate real attendance % for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    const attRes = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        COUNT(*) FILTER (WHERE status = 'PRESENT') as present 
      FROM "Attendance"
      WHERE date >= $1 AND date < $2
    `, [today, nextDay]);
    const totalAtt = parseInt(attRes.rows[0].total) || 0;
    const presentAtt = parseInt(attRes.rows[0].present) || 0;
    const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    const stats = {
      totalStudents: parseInt(studentCount.rows[0].count),
      totalTeachers: parseInt(teacherCount.rows[0].count),
      activeClasses: parseInt(classCount.rows[0].count),
      attendance: attendancePercent,
      attendanceTotal: totalAtt,
      attendancePresent: presentAtt,
      revenue: 0 // No fee table yet
    };
    
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/principal', requireRole(['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), async (req, res) => {
  try {
    const studentCount = await pool.query('SELECT COUNT(*) FROM "Student" WHERE "isDeleted" = false');
    const teacherCount = await pool.query('SELECT COUNT(*) FROM "Teacher"');
    const classCount = await pool.query('SELECT COUNT(*) FROM "Class"');
    
    // Calculate real attendance % for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    const attRes = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        COUNT(*) FILTER (WHERE status = 'PRESENT') as present 
      FROM "Attendance"
      WHERE date >= $1 AND date < $2
    `, [today, nextDay]);
    const totalAtt = parseInt(attRes.rows[0].total) || 0;
    const presentAtt = parseInt(attRes.rows[0].present) || 0;
    const attendancePercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    // Pending teacher applications
    const pendingRes = await pool.query(`SELECT COUNT(*) FROM "TeacherApplication" WHERE status = 'PENDING'`);
    const pendingApprovals = parseInt(pendingRes.rows[0].count) || 0;

    const stats = {
      attendance: attendancePercent,
      attendanceTotal: totalAtt,
      attendancePresent: presentAtt,
      pendingApprovals: pendingApprovals,
      totalStudents: parseInt(studentCount.rows[0].count),
      totalTeachers: parseInt(teacherCount.rows[0].count),
      activeClasses: parseInt(classCount.rows[0].count)
    };
    
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

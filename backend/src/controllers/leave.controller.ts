import { Request, Response } from 'express';
import pool from '../config/prisma';
import { z } from 'zod';
import { parsePaginationParams, formatPaginatedResponse } from '../utils/pagination';
import { PushService } from '../services/push.service';

const ApplyLeaveSchema = z.object({
  type: z.string(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  totalDays: z.number().min(1),
  reason: z.string().max(150),
  attachmentUrl: z.string().optional().nullable()
});

export class LeaveController {
  
  async applyLeave(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const parsed = ApplyLeaveSchema.parse(req.body);
      let newLeave;

      if (user.role === 'STUDENT') {
        const studentRes = await pool.query('SELECT id FROM "Student" WHERE "userId" = $1', [user.userId]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        const studentId = studentRes.rows[0].id;

        const result = await pool.query(
          `INSERT INTO "LeaveRequest" ("id", "studentId", "type", "fromDate", "toDate", "totalDays", "reason", "attachmentUrl", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
          [studentId, parsed.type, parsed.fromDate, parsed.toDate, parsed.totalDays, parsed.reason, parsed.attachmentUrl || null]
        );
        newLeave = result.rows[0];
        
        PushService.sendToPrincipals(
          'New Leave Request',
          `A student requested ${parsed.totalDays} day(s) of leave for: ${parsed.reason.substring(0, 30)}...`
        );
      } else if (user.role === 'TEACHER') {
        const teacherRes = await pool.query('SELECT id FROM "Teacher" WHERE "userId" = $1', [user.userId]);
        if (teacherRes.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
        const teacherId = teacherRes.rows[0].id;

        const result = await pool.query(
          `INSERT INTO "LeaveRequest" ("id", "teacherId", "type", "fromDate", "toDate", "totalDays", "reason", "attachmentUrl", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
          [teacherId, parsed.type, parsed.fromDate, parsed.toDate, parsed.totalDays, parsed.reason, parsed.attachmentUrl || null]
        );
        newLeave = result.rows[0];
        
        PushService.sendToPrincipals(
          'New Teacher Leave Request',
          `A teacher requested ${parsed.totalDays} day(s) of leave. Action required.`
        );
      } else {
        return res.status(403).json({ error: 'Only students and teachers can apply for leave' });
      }
      return res.json(newLeave);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMyLeaves(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const pageParams = parsePaginationParams(req);

      if (user.role === 'STUDENT') {
        const studentRes = await pool.query('SELECT id FROM "Student" WHERE "userId" = $1', [user.userId]);
        if (studentRes.rows.length === 0) return res.json(formatPaginatedResponse([], 0, pageParams));
        const studentId = studentRes.rows[0].id;

        const countRes = await pool.query('SELECT COUNT(*) FROM "LeaveRequest" WHERE "studentId" = $1', [studentId]);
        const totalRecords = parseInt(countRes.rows[0].count, 10);

        const result = await pool.query(
          'SELECT * FROM "LeaveRequest" WHERE "studentId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
          [studentId, pageParams.limit, pageParams.offset]
        );
        return res.json(formatPaginatedResponse(result.rows, totalRecords, pageParams));
      } else if (user.role === 'TEACHER') {
        const teacherRes = await pool.query('SELECT id FROM "Teacher" WHERE "userId" = $1', [user.userId]);
        if (teacherRes.rows.length === 0) return res.json(formatPaginatedResponse([], 0, pageParams));
        const teacherId = teacherRes.rows[0].id;

        const countRes = await pool.query('SELECT COUNT(*) FROM "LeaveRequest" WHERE "teacherId" = $1', [teacherId]);
        const totalRecords = parseInt(countRes.rows[0].count, 10);

        const result = await pool.query(
          'SELECT * FROM "LeaveRequest" WHERE "teacherId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
          [teacherId, pageParams.limit, pageParams.offset]
        );
        return res.json(formatPaginatedResponse(result.rows, totalRecords, pageParams));
      }
      return res.json(formatPaginatedResponse([], 0, pageParams));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllLeaves(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const pageParams = parsePaginationParams(req);

      // Student count and paginated query
      const studentCountRes = await pool.query('SELECT COUNT(*) FROM "LeaveRequest" WHERE "studentId" IS NOT NULL');
      const studentTotal = parseInt(studentCountRes.rows[0].count, 10);

      const studentLeaves = await pool.query(`
        SELECT lr.*, s."firstName", s."lastName", s."scholarNumber", s."rollNumber", 
               c.name as "className", sec.name as "sectionName"
        FROM "LeaveRequest" lr
        JOIN "Student" s ON lr."studentId" = s.id
        LEFT JOIN "Section" sec ON s."sectionId" = sec.id
        LEFT JOIN "Class" c ON sec."classId" = c.id
        WHERE lr."studentId" IS NOT NULL
        ORDER BY lr."createdAt" DESC
        LIMIT $1 OFFSET $2
      `, [pageParams.limit, pageParams.offset]);
      
      // Teacher count and paginated query
      const teacherCountRes = await pool.query('SELECT COUNT(*) FROM "LeaveRequest" WHERE "teacherId" IS NOT NULL');
      const teacherTotal = parseInt(teacherCountRes.rows[0].count, 10);

      const teacherLeaves = await pool.query(`
        SELECT lr.*, t."firstName", t."lastName", t.subject
        FROM "LeaveRequest" lr
        JOIN "Teacher" t ON lr."teacherId" = t.id
        WHERE lr."teacherId" IS NOT NULL
        ORDER BY lr."createdAt" DESC
        LIMIT $1 OFFSET $2
      `, [pageParams.limit, pageParams.offset]);

      return res.json({
        success: true,
        studentLeaves: formatPaginatedResponse(studentLeaves.rows, studentTotal, pageParams),
        teacherLeaves: formatPaginatedResponse(teacherLeaves.rows, teacherTotal, pageParams)
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateLeaveStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { status } = req.body; // 'APPROVED' or 'REJECTED'

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const result = await pool.query(
        'UPDATE "LeaveRequest" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Leave request not found' });
      
      return res.json(result.rows[0]);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

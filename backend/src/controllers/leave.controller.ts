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

  async debugPushEnv(req: Request, res: Response) {
    try {
      const { getApps } = require('firebase-admin/app');
      const hasApps = getApps().length > 0;
      const base64Len = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.length : 0;
      
      let initError = null;
      try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
           JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
        }
      } catch (err: any) {
        initError = err.message;
      }

      return res.json({ 
        hasApps, 
        base64Len, 
        initError,
        dbUrlLen: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
      });
    } catch (error: any) {
      return res.json({ error: error.message });
    }
  }

  async testPush(req: Request, res: Response) {
    try {
      const { getApps } = require('firebase-admin/app');
      if (!getApps().length) return res.json({ success: false, error: 'Firebase not initialized' });

      // Copy paste the EXACT implementation to catch any internal errors
      const result = await pool.query(
        'SELECT id FROM "User" WHERE role = \'PRINCIPAL\' AND "isDeleted" = false'
      );
      const principalIds = result.rows.map((row: any) => row.id);
      
      const result2 = await pool.query(
        'SELECT "fcmToken" FROM "User" WHERE id = ANY($1) AND "fcmToken" IS NOT NULL',
        [principalIds]
      );
      const tokens = result2.rows.map((row: any) => row.fcmToken).filter((token: string) => !!token);

      if (tokens.length === 0) {
        return res.json({ success: false, error: 'No tokens found' });
      }

      const { getMessaging } = require('firebase-admin/messaging');
      const message = {
        notification: { title: 'Test', body: 'Test' },
        tokens: tokens,
        data: {}
      };

      const response = await getMessaging().sendEachForMulticast(message);
      return res.json({ success: true, response });
    } catch (e: any) {
      return res.json({ success: false, error: e.message, stack: e.stack });
    }
  }

  async applyLeave(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const parsed = ApplyLeaveSchema.parse(req.body);

      if (user.role === 'STUDENT') {
        const studentRes = await pool.query('SELECT id, "firstName", "lastName", "classSection" FROM "Student" WHERE "userId" = $1', [user.userId]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        const s = studentRes.rows[0];
        const studentId = s.id;

        const result = await pool.query(
          `INSERT INTO "LeaveRequest" ("id", "studentId", "type", "fromDate", "toDate", "totalDays", "reason", "attachmentUrl", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
          [studentId, parsed.type, parsed.fromDate, parsed.toDate, parsed.totalDays, parsed.reason, parsed.attachmentUrl || null]
        );
        try {
          const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
          const pushResult = await PushService.sendToPrincipals(
            `Student Leave: ${fullName} (${s.classSection || 'N/A'})`,
            `${parsed.totalDays} Day(s) ${parsed.type}: "${parsed.reason}"`
          );
          return res.json({ ...result.rows[0], pushSuccess: true, pushResult });
        } catch (pushErr: any) {
          return res.json({ ...result.rows[0], pushSuccess: false, pushError: pushErr.message });
        }
      } else if (user.role === 'TEACHER') {
        const teacherRes = await pool.query('SELECT id, "firstName", "lastName", "subject" FROM "Teacher" WHERE "userId" = $1', [user.userId]);
        if (teacherRes.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
        const t = teacherRes.rows[0];
        const teacherId = t.id;

        const result = await pool.query(
          `INSERT INTO "LeaveRequest" ("id", "teacherId", "type", "fromDate", "toDate", "totalDays", "reason", "attachmentUrl", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
          [teacherId, parsed.type, parsed.fromDate, parsed.toDate, parsed.totalDays, parsed.reason, parsed.attachmentUrl || null]
        );
        try {
          const fullName = `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Teacher';
          const pushResult = await PushService.sendToPrincipals(
            `Teacher Leave: ${fullName} (${t.subject || 'Staff'})`,
            `${parsed.totalDays} Day(s) ${parsed.type}: "${parsed.reason}"`
          );
          return res.json({ ...result.rows[0], pushSuccess: true, pushResult });
        } catch (pushErr: any) {
          return res.json({ ...result.rows[0], pushSuccess: false, pushError: pushErr.message });
        }
      } else {
        return res.status(403).json({ error: 'Only students and teachers can apply for leave' });
      }
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

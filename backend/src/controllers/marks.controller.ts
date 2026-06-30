import { Request, Response } from 'express';
import pool from '../config/prisma';
import { handleError } from '../utils/errorHandler';

export class MarksController {
  getMarks = async (req: Request, res: Response) => {
    try {
      const { classId, sectionId, examType } = req.query;
      let query = `
        SELECT m.*, s."firstName", s."lastName", s."scholarNumber", sub.name as "subjectName"
        FROM "Mark" m
        JOIN "Student" s ON m."studentId" = s.id
        JOIN "Subject" sub ON m."subjectId" = sub.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let count = 1;

      if (examType) {
        query += ` AND m."examType" = $${count++}`;
        values.push(examType);
      }

      const result = await pool.query(query, values);
      return res.status(200).json(result.rows);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  getStudentMarks = async (req: Request, res: Response) => {
    try {
      const studentId = req.params.studentId;
      const user = (req as any).user;
      
      // Basic check: students can only see their own marks
      if (user.role === 'STUDENT') {
        const studentRes = await pool.query('SELECT id FROM "Student" WHERE "userId" = $1', [user.userId]);
        if (studentRes.rows.length === 0 || studentRes.rows[0].id !== studentId) {
          throw new Error('Unauthorized');
        }
      }

      const result = await pool.query(`
        SELECT m.*, sub.name as "subjectName"
        FROM "Mark" m
        JOIN "Subject" sub ON m."subjectId" = sub.id
        WHERE m."studentId" = $1
      `, [studentId]);

      return res.status(200).json(result.rows);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  upsertMarks = async (req: Request, res: Response) => {
    try {
      const { marksData } = req.body;
      if (!Array.isArray(marksData)) {
        throw new Error('marksData must be an array');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const results = [];
        
        for (const mark of marksData) {
          const res = await client.query(
            `INSERT INTO "Mark" (id, "studentId", "subjectId", "examType", score, "maxScore", "academicYear", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, COALESCE($6, '2025-26'), NOW(), NOW())
             ON CONFLICT ("studentId", "subjectId", "examType", "academicYear") DO UPDATE 
             SET score = EXCLUDED.score, "maxScore" = EXCLUDED."maxScore", "updatedAt" = NOW()
             RETURNING *`,
            [mark.studentId, mark.subjectId, mark.examType, mark.score, mark.maxScore || 100, mark.academicYear]
          );
          results.push(res.rows[0]);
        }
        await client.query('COMMIT');
        return res.status(200).json({ message: 'Marks saved successfully', results });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (error: any) {
      handleError(res, error);
    }
  };
}

import { Request, Response } from 'express';
import pool from '../config/prisma';
import { handleError } from '../utils/errorHandler';

export class SubjectController {
  getSubjects = async (req: Request, res: Response) => {
    try {
      const { classId } = req.query;
      let query = `SELECT s.*, c.name as "className" FROM "Subject" s JOIN "Class" c ON s."classId" = c.id`;
      const values: any[] = [];
      
      if (classId) {
        query += ` WHERE s."classId" = $1`;
        values.push(classId);
      }
      
      const result = await pool.query(query, values);
      return res.status(200).json(result.rows);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  createSubject = async (req: Request, res: Response) => {
    try {
      const { name, classId } = req.body;
      const result = await pool.query(
        `INSERT INTO "Subject" (id, name, "classId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING *`,
        [name, classId]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  deleteSubject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query(`DELETE FROM "Subject" WHERE id = $1`, [id]);
      return res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error: any) {
      handleError(res, error);
    }
  };
}

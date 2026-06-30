import { Request, Response } from 'express';
import pool from '../config/prisma';
import { handleError } from '../utils/errorHandler';
import { parsePaginationParams, formatPaginatedResponse } from '../utils/pagination';

export class NotificationsController {
  getNotifications = async (req: Request, res: Response) => {
    try {
      const pageParams = parsePaginationParams(req);
      const countRes = await pool.query('SELECT COUNT(*) FROM "Notification"');
      const totalRecords = parseInt(countRes.rows[0].count, 10);

      const result = await pool.query(
        `SELECT n.*, u.email as "createdByEmail"
         FROM "Notification" n
         JOIN "User" u ON n."createdById" = u.id
         ORDER BY n."createdAt" DESC
         LIMIT $1 OFFSET $2`,
        [pageParams.limit, pageParams.offset]
      );
      return res.status(200).json(formatPaginatedResponse(result.rows, totalRecords, pageParams));
    } catch (error: any) {
      handleError(res, error);
    }
  };

  createNotification = async (req: Request, res: Response) => {
    try {
      const { title, body, type, targetClassId, targetSectionId, targetStudentId } = req.body;
      const user = (req as any).user;
      
      const result = await pool.query(
        `INSERT INTO "Notification" (id, title, body, type, "targetClassId", "targetSectionId", "targetStudentId", "createdById", "createdAt") 
         VALUES (gen_random_uuid(), $1, $2, COALESCE($3, 'general'), $4, $5, $6, $7, NOW()) RETURNING *`,
        [title, body, type, targetClassId, targetSectionId, targetStudentId, user.userId]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  deleteNotification = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query(`DELETE FROM "Notification" WHERE id = $1`, [id]);
      return res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error: any) {
      handleError(res, error);
    }
  };
}

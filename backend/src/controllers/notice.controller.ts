import { Request, Response } from 'express';
import pool from '../config/prisma';
import { handleError } from '../utils/errorHandler';
import { PushService } from '../services/push.service';

export class NoticeController {
  async createNotice(req: Request, res: Response) {
    try {
      const { title, message, targetAudience } = req.body;
      const user = (req as any).user;

      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
      }

      const audience = targetAudience || 'ALL';

      const result = await pool.query(
        `INSERT INTO "Notice" (id, title, message, "targetAudience", "createdById", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW()) RETURNING *`,
        [title, message, audience, user.userId]
      );

      const notice = result.rows[0];

      // Send immediate push notification asynchronously
      let targetRoles: string[] = [];
      if (audience === 'ALL') {
        targetRoles = ['TEACHER', 'STUDENT', 'PARENT', 'PRINCIPAL', 'SCHOOL_ADMIN'];
      } else if (audience === 'TEACHERS') {
        targetRoles = ['TEACHER'];
      } else if (audience === 'STUDENTS') {
        targetRoles = ['STUDENT'];
      } else if (audience === 'PARENTS') {
        targetRoles = ['PARENT'];
      }

      PushService.sendToRoles(
        targetRoles,
        `📢 School Notice: ${title}`,
        message,
        { type: 'NOTICE', noticeId: notice.id }
      ).catch(err => console.error('Error sending notice push:', err));

      res.status(201).json(notice);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getNotices(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const role = user.role;

      let audienceFilter = `("targetAudience" = 'ALL')`;
      if (role === 'TEACHER') {
        audienceFilter = `("targetAudience" IN ('ALL', 'TEACHERS'))`;
      } else if (role === 'STUDENT') {
        audienceFilter = `("targetAudience" IN ('ALL', 'STUDENTS'))`;
      } else if (role === 'PARENT') {
        audienceFilter = `("targetAudience" IN ('ALL', 'PARENTS'))`;
      } else if (role === 'PRINCIPAL' || role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') {
        audienceFilter = `1=1`;
      }

      const result = await pool.query(
        `SELECT n.*, u.email as "createdByEmail",
          CASE WHEN nr."noticeId" IS NOT NULL THEN true ELSE false END as "isRead"
         FROM "Notice" n
         JOIN "User" u ON n."createdById" = u.id
         LEFT JOIN "NoticeRead" nr ON n.id = nr."noticeId" AND nr."userId" = $1
         WHERE ${audienceFilter}
         ORDER BY n."createdAt" DESC
         LIMIT 100`,
        [user.userId]
      );

      const notices = result.rows;
      const unreadCount = notices.filter(n => !n.isRead).length;

      res.status(200).json({ notices, unreadCount });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const role = user.role;

      let audienceFilter = `("targetAudience" = 'ALL')`;
      if (role === 'TEACHER') {
        audienceFilter = `("targetAudience" IN ('ALL', 'TEACHERS'))`;
      } else if (role === 'STUDENT') {
        audienceFilter = `("targetAudience" IN ('ALL', 'STUDENTS'))`;
      } else if (role === 'PARENT') {
        audienceFilter = `("targetAudience" IN ('ALL', 'PARENTS'))`;
      } else if (role === 'PRINCIPAL' || role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') {
        audienceFilter = `1=1`;
      }

      await pool.query(
        `INSERT INTO "NoticeRead" ("noticeId", "userId", "readAt")
         SELECT n.id, $1, NOW()
         FROM "Notice" n
         WHERE ${audienceFilter}
           AND NOT EXISTS (
             SELECT 1 FROM "NoticeRead" nr WHERE nr."noticeId" = n.id AND nr."userId" = $1
           )
         ON CONFLICT ("noticeId", "userId") DO NOTHING`,
        [user.userId]
      );

      res.status(200).json({ message: 'Marked all notices as read' });
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

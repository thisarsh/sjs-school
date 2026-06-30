import pool from '../config/prisma';
import bcrypt from 'bcrypt';

export class ParentService {
  async getAllParents(limit: number, offset: number) {
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM "Parent" p 
       JOIN "User" u ON p."userId" = u.id 
       WHERE u."isDeleted" = false`
    );
    const totalRecords = parseInt(countRes.rows[0].count, 10);

    const result = await pool.query(
      `SELECT p.*, u.email, u."isDeleted" 
       FROM "Parent" p 
       JOIN "User" u ON p."userId" = u.id
       WHERE u."isDeleted" = false
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { rows: result.rows, totalRecords };
  }

  async getParentById(id: string) {
    const result = await pool.query(
      `SELECT p.*, u.email, u."isDeleted" 
       FROM "Parent" p 
       JOIN "User" u ON p."userId" = u.id 
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async createParent(data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const hashedPassword = await bcrypt.hash(data.password || 'defaultPassword123', 10);
      
      const userResult = await client.query(
        `INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, 'PARENT', NOW(), NOW()) RETURNING id`,
        [data.email, hashedPassword]
      );
      const userId = userResult.rows[0].id;

      const parentResult = await client.query(
        `INSERT INTO "Parent" (id, "userId", "firstName", "lastName", phone, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
        [userId, data.firstName, data.lastName, data.phone || null]
      );
      await client.query('COMMIT');
      return parentResult.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateParent(id: string, data: any) {
    const result = await pool.query(
      `UPDATE "Parent" SET "firstName" = COALESCE($2, "firstName"), "lastName" = COALESCE($3, "lastName"), 
       phone = COALESCE($4, phone), "updatedAt" = NOW() 
       WHERE id = $1 RETURNING *`,
      [id, data.firstName, data.lastName, data.phone]
    );
    return result.rows[0];
  }

  async deleteParent(id: string) {
    const parentResult = await pool.query('SELECT "userId" FROM "Parent" WHERE id = $1', [id]);
    if (parentResult.rows.length === 0) throw new Error('Parent not found');
    
    await pool.query('UPDATE "User" SET "isDeleted" = true WHERE id = $1', [parentResult.rows[0].userId]);
    return { message: 'Parent soft-deleted' };
  }
}

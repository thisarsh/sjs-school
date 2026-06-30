import pool from '../config/prisma';
import bcrypt from 'bcrypt';

export class TeacherService {
  async getMe(userId: string) {
    const result = await pool.query(
      `SELECT t.*, u.email, u."isDeleted" 
       FROM "Teacher" t 
       JOIN "User" u ON t."userId" = u.id 
       WHERE t."userId" = $1`,
      [userId]
    );
    const teacher = result.rows[0] || null;
    if (!teacher) return null;

    const ctRes = await pool.query(
      `SELECT c.name as "className", s.name as "sectionName" 
       FROM "Section" s JOIN "Class" c ON s."classId" = c.id 
       WHERE s."classTeacherId" = $1`,
      [teacher.id]
    );
    const classTeacherOf = ctRes.rows.map(r => `${r.className} ${r.sectionName}`);

    const stRes = await pool.query(
      `SELECT c.name as "className", s.name as "sectionName", s."subjectTeachers" 
       FROM "Section" s JOIN "Class" c ON s."classId" = c.id 
       WHERE s."subjectTeachers" LIKE $1`,
      [`%${teacher.id}%`]
    );
    
    const subjectTeacherOfSet = new Set<string>();
    for (const row of stRes.rows) {
      try {
        if (row.subjectTeachers) {
          const st = JSON.parse(row.subjectTeachers);
          for (const sub in st) {
            if (st[sub]?.teacherId === teacher.id) {
              subjectTeacherOfSet.add(`${row.className} ${row.sectionName}`);
              break;
            }
          }
        }
      } catch (e) {}
    }

    return {
      ...teacher,
      classTeacherOf,
      subjectTeacherOf: Array.from(subjectTeacherOfSet)
    };
  }

  async updateTeacherMe(userId: string, data: any) {
    const result = await pool.query(
      `UPDATE "Teacher" SET 
        "firstName" = $1, 
        "lastName" = $2, 
        phone = $3, 
        address = $4, 
        qualification = $5, 
        experience = $6, 
        subject = $7, 
        classes = $8, 
        "profilePic" = $9, 
        "updatedAt" = NOW() 
       WHERE "userId" = $10 RETURNING *`,
      [
        data.firstName, 
        data.lastName, 
        data.phone || null, 
        data.address || null, 
        data.qualification || null, 
        data.experience || null, 
        data.subject || null, 
        data.classes || null, 
        data.profilePic || null, 
        userId
      ]
    );
    if (result.rows.length === 0) {
      throw new Error('Teacher not found for this user');
    }
    return result.rows[0];
  }

  async getAllTeachers(limit: number, offset: number) {
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM "Teacher" t 
       JOIN "User" u ON t."userId" = u.id 
       WHERE u."isDeleted" = false`
    );
    const totalRecords = parseInt(countRes.rows[0].count, 10);

    const result = await pool.query(
      `SELECT t.*, u.email, u."isDeleted" 
       FROM "Teacher" t 
       JOIN "User" u ON t."userId" = u.id
       WHERE u."isDeleted" = false
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { rows: result.rows, totalRecords };
  }

  async getTeacherById(id: string) {
    const result = await pool.query(
      `SELECT t.*, u.email, u."isDeleted" 
       FROM "Teacher" t 
       JOIN "User" u ON t."userId" = u.id 
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async createTeacher(data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const hashedPassword = await bcrypt.hash(data.password || 'defaultPassword123', 10);
      
      const userResult = await client.query(
        `INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, 'TEACHER', NOW(), NOW()) RETURNING id`,
        [data.email, hashedPassword]
      );
      const userId = userResult.rows[0].id;

      let schoolId = data.schoolId;
      if (!schoolId) {
        const sRes = await client.query('SELECT id FROM "School" LIMIT 1');
        if (sRes.rows.length > 0) schoolId = sRes.rows[0].id;
        else {
          const ns = await client.query(`INSERT INTO "School" (id, name, "createdAt", "updatedAt") VALUES (gen_random_uuid(), 'SJS Public School', NOW(), NOW()) RETURNING id`);
          schoolId = ns.rows[0].id;
        }
      }

      const teacherResult = await client.query(
        `INSERT INTO "Teacher" (id, "userId", "schoolId", "firstName", "lastName", phone, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
        [userId, schoolId, data.firstName, data.lastName, data.phone || null]
      );
      await client.query('COMMIT');
      return teacherResult.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateTeacher(id: string, data: any) {
    if (data.password) {
      const teacherResult = await pool.query('SELECT "userId" FROM "Teacher" WHERE id = $1', [id]);
      if (teacherResult.rows.length > 0) {
        const userId = teacherResult.rows[0].userId;
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await pool.query('UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2', [hashedPassword, userId]);
      }
    }

    const result = await pool.query(
      `UPDATE "Teacher" SET "firstName" = COALESCE($2, "firstName"), "lastName" = COALESCE($3, "lastName"), 
       phone = COALESCE($4, phone), "updatedAt" = NOW() 
       WHERE id = $1 RETURNING *`,
      [id, data.firstName, data.lastName, data.phone]
    );
    return result.rows[0];
  }

  async deleteTeacher(id: string) {
    const teacherResult = await pool.query('SELECT "userId" FROM "Teacher" WHERE id = $1', [id]);
    if (teacherResult.rows.length === 0) throw new Error('Teacher not found');
    
    await pool.query('UPDATE "User" SET "isDeleted" = true WHERE id = $1', [teacherResult.rows[0].userId]);
    return { message: 'Teacher soft-deleted' };
  }

  // --- Teacher Application Workflow ---

  async applyForTeaching(data: any) {
    try {
      const result = await pool.query(
        `INSERT INTO "TeacherApplication" (id, "firstName", "lastName", email, phone, address, qualification, experience, subject, classes, status, "createdAt", "profilePic")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', NOW(), $10) RETURNING *`,
        [data.firstName, data.lastName, data.email, data.phone || null, data.address || null, data.qualification || null, data.experience || null, data.subject, data.classes || null, data.profilePic || null]
      );
      return result.rows[0];
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate')) {
        throw new Error('DUPLICATE_EMAIL');
      }
      throw err;
    }
  }

  async getApplications(limit: number, offset: number) {
    const countRes = await pool.query(`SELECT COUNT(*) FROM "TeacherApplication"`);
    const totalRecords = parseInt(countRes.rows[0].count, 10);

    const result = await pool.query(
      `SELECT * FROM "TeacherApplication" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { rows: result.rows, totalRecords };
  }

  async approveApplication(id: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const appRes = await client.query(`SELECT * FROM "TeacherApplication" WHERE id = $1`, [id]);
      const app = appRes.rows[0];
      if (!app) throw new Error('Application not found');
      if (app.status === 'APPROVED') throw new Error('Application already approved');

      // Create login user with phone number as password
      const hashedPassword = await bcrypt.hash(app.phone, 10);
      const userResult = await client.query(
        `INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, 'TEACHER', NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET "isDeleted" = false
         RETURNING id`,
        [app.email, hashedPassword]
      );
      const userId = userResult.rows[0].id;

      let schoolId = 'default-school-id';
      const sRes = await client.query('SELECT id FROM "School" LIMIT 1');
      if (sRes.rows.length > 0) schoolId = sRes.rows[0].id;
      else {
        const ns = await client.query(`INSERT INTO "School" (id, name, "createdAt", "updatedAt") VALUES (gen_random_uuid(), 'SJS Public School', NOW(), NOW()) RETURNING id`);
        schoolId = ns.rows[0].id;
      }

      // Create Teacher record
      const teacherResult = await client.query(
        `INSERT INTO "Teacher" (id, "userId", "schoolId", "firstName", "lastName", phone, address, qualification, experience, subject, classes, "createdAt", "updatedAt", "profilePic") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11)
         ON CONFLICT ("userId") DO UPDATE SET 
           "firstName" = EXCLUDED."firstName",
           address = EXCLUDED.address,
           qualification = EXCLUDED.qualification,
           experience = EXCLUDED.experience,
           subject = EXCLUDED.subject,
           classes = EXCLUDED.classes,
           "profilePic" = EXCLUDED."profilePic"
         RETURNING *`,
        [userId, schoolId, app.firstName, app.lastName, app.phone, app.address, app.qualification, app.experience, app.subject, app.classes || null, app.profilePic || null]
      );

      // Update application status
      await client.query(`UPDATE "TeacherApplication" SET status = 'APPROVED' WHERE id = $1`, [id]);

      await client.query('COMMIT');
      return { message: 'Teacher approved and onboarded', teacher: teacherResult.rows[0] };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async rejectApplication(id: string) {
    const result = await pool.query(
      `DELETE FROM "TeacherApplication" WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('Application not found');
    return { message: 'Application disapproved and removed from DB', removed: result.rows[0] };
  }
}

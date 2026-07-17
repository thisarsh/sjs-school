import pool from '../config/prisma';
import bcrypt from 'bcrypt';

export class StudentService {
  async getAllStudents(limit: number, offset: number) {
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM "Student" s 
       JOIN "User" u ON s."userId" = u.id 
       WHERE u."isDeleted" = false`
    );
    const totalRecords = parseInt(countRes.rows[0].count, 10);

    const result = await pool.query(
      `SELECT s.*, u.email, u."isDeleted", 
              COALESCE(sec.name, '') as "sectionName", 
              COALESCE(cls.name, '') as "className", 
              p.phone as "parentMobile",
              p."secondaryPhone" as "parentSecondaryMobile",
              p."firstName" as "fatherName",
              p."lastName" as "motherName",
              p.email as "parentEmail",
              t.type as "transportType",
              t.name as "transportName",
              t.route as "transportRoute",
              t.driverName as "transportDriverName",
              t.driverPhone as "transportDriverPhone",
              t.conductorName as "transportConductorName",
              t.conductorPhone as "transportConductorPhone",
              t."vehicleNumber" as "transportVehicleNumber"
       FROM "Student" s 
       JOIN "User" u ON s."userId" = u.id
       LEFT JOIN "Section" sec ON s."sectionId" = sec.id
       LEFT JOIN "Class" cls ON sec."classId" = cls.id
       LEFT JOIN "Parent" p ON s."parentId" = p.id
       LEFT JOIN "Transport" t ON s."transportId" = t.id
       WHERE u."isDeleted" = false
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { rows: result.rows, totalRecords };
  }

  async getStudentById(id: string) {
    const result = await pool.query(
      `SELECT s.*, u.email, u."isDeleted",
              p.phone as "parentMobile",
              p."secondaryPhone" as "parentSecondaryMobile",
              p."firstName" as "fatherName",
              p."lastName" as "motherName",
              p.email as "parentEmail",
              t.type as "transportType",
              t.name as "transportName",
              t.route as "transportRoute",
              t.driverName as "transportDriverName",
              t.driverPhone as "transportDriverPhone",
              t.conductorName as "transportConductorName",
              t.conductorPhone as "transportConductorPhone",
              t."vehicleNumber" as "transportVehicleNumber"
       FROM "Student" s 
       JOIN "User" u ON s."userId" = u.id 
       LEFT JOIN "Parent" p ON s."parentId" = p.id
       LEFT JOIN "Transport" t ON s."transportId" = t.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getStudentByUserId(userId: string) {
    const result = await pool.query(
      `SELECT s.*, u.email, u."isDeleted",
              COALESCE(sec.name, '') as "sectionName", 
              COALESCE(cls.name, '') as "className", 
              p.phone as "parentMobile",
              p."secondaryPhone" as "parentSecondaryMobile",
              p."firstName" as "fatherName",
              p."lastName" as "motherName",
              p.email as "parentEmail",
              t.type as "transportType",
              t.name as "transportName",
              t.route as "transportRoute",
              t.driverName as "transportDriverName",
              t.driverPhone as "transportDriverPhone",
              t.conductorName as "transportConductorName",
              t.conductorPhone as "transportConductorPhone",
              t."vehicleNumber" as "transportVehicleNumber"
       FROM "Student" s 
       JOIN "User" u ON s."userId" = u.id 
       LEFT JOIN "Section" sec ON s."sectionId" = sec.id
       LEFT JOIN "Class" cls ON sec."classId" = cls.id
       LEFT JOIN "Parent" p ON s."parentId" = p.id
       LEFT JOIN "Transport" t ON s."transportId" = t.id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async createStudent(data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const hashedPassword = await bcrypt.hash(data.password || 'defaultPassword123', 10);

      const userResult = await client.query(
        `INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, 'STUDENT', NOW(), NOW()) RETURNING id`,
        [data.email, hashedPassword]
      );
      const userId = userResult.rows[0].id;

      const studentResult = await client.query(
        `INSERT INTO "Student" (id, "userId", "schoolId", "sectionId", "firstName", "lastName", "scholarNumber", dob, gender, "rollNumber", address, "aadhaarNumber", "bloodGroup", "profilePic", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING *`,
        [userId, data.schoolId, data.sectionId || null, data.firstName, data.lastName, data.scholarNumber, data.dob || null, data.gender || null, data.rollNumber || null, data.address || null, data.aadhaarNumber || null, data.bloodGroup || null, data.profilePic || null]
      );
      await client.query('COMMIT');
      return studentResult.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateStudent(id: string, data: any) {
    if (data.password) {
      const studentResult = await pool.query('SELECT "userId" FROM "Student" WHERE id = $1', [id]);
      if (studentResult.rows.length > 0) {
        const userId = studentResult.rows[0].userId;
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await pool.query('UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2', [hashedPassword, userId]);
      }
    }

    const result = await pool.query(
      `UPDATE "Student" SET 
        "firstName" = COALESCE($2, "firstName"), 
        "lastName" = COALESCE($3, "lastName"), 
        "scholarNumber" = COALESCE($4, "scholarNumber"), 
        dob = COALESCE($5, dob),
        "sectionId" = COALESCE($6, "sectionId"),
        gender = COALESCE($7, gender),
        "rollNumber" = COALESCE($8, "rollNumber"),
        address = COALESCE($9, address),
        "aadhaarNumber" = COALESCE($10, "aadhaarNumber"),
        "bloodGroup" = COALESCE($11, "bloodGroup"),
        "profilePic" = COALESCE($12, "profilePic"),
        "useSchoolTransport" = CASE WHEN $13::boolean THEN $14::boolean ELSE "useSchoolTransport" END,
        "transportId" = CASE WHEN $15::boolean THEN $16 ELSE "transportId" END,
        "updatedAt" = NOW() 
       WHERE id = $1 RETURNING *`,
      [
        id, data.firstName, data.lastName, data.scholarNumber, data.dob || null, data.sectionId || null,
        data.gender || null, data.rollNumber || null, data.address || null, data.aadhaarNumber || null,
        data.bloodGroup || null, data.profilePic || null,
        data.useSchoolTransport !== undefined, // $13: is useSchoolTransport provided?
        data.useSchoolTransport === true || data.useSchoolTransport === 'true', // $14: useSchoolTransport value
        data.transportId !== undefined, // $15: is transportId provided?
        data.transportId || null // $16: transportId value
      ]
    );
    return result.rows[0];
  }

  async deleteStudent(id: string) {
    const studentResult = await pool.query('SELECT "userId" FROM "Student" WHERE id = $1', [id]);
    if (studentResult.rows.length === 0) throw new Error('Student not found');

    await pool.query('UPDATE "User" SET "isDeleted" = true WHERE id = $1', [studentResult.rows[0].userId]);
    return { message: 'Student soft-deleted' };
  }

  async apply(data: any) {
    try {
      const existingStudent = await pool.query('SELECT id FROM "Student" WHERE "scholarNumber" = $1', [data.scholarNumber]);
      if (existingStudent.rows.length > 0) {
        throw new Error('DUPLICATE_SCHOLAR_NUMBER');
      }

      const result = await pool.query(
        `INSERT INTO "StudentApplication" (
           id, "firstName", "lastName", "scholarNumber", "classApplying", section, "rollNumber", dob, gender, "fatherName", "motherName", "parentMobile", "parentSecondaryMobile", "parentEmail", address, "aadhaarNumber", "bloodGroup", status, "createdAt", "profilePic", "useSchoolTransport", "transportId"
         ) VALUES (
           gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'PENDING', NOW(), $17, $18, $19
         ) RETURNING *`,
        [
          data.firstName, data.lastName, data.scholarNumber, data.classApplying, data.section || null, data.rollNumber || null,
          data.dob, data.gender, data.fatherName, data.motherName, data.parentMobile, data.parentSecondaryMobile || null, data.parentEmail || null, data.address,
          data.aadhaarNumber || null, data.bloodGroup || null, data.profilePic || null,
          data.useSchoolTransport || false, data.transportId || null
        ]
      );
      return result.rows[0];
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate') || err.message === 'DUPLICATE_SCHOLAR_NUMBER') {
        throw new Error('DUPLICATE_SCHOLAR_NUMBER');
      }
      throw err;
    }
  }

  async checkScholarNumber(scholarNumber: string) {
    const existingStudent = await pool.query('SELECT id FROM "Student" WHERE "scholarNumber" = $1', [scholarNumber]);
    const existingApplication = await pool.query('SELECT id FROM "StudentApplication" WHERE "scholarNumber" = $1 AND status != \'REJECTED\'', [scholarNumber]);
    return existingStudent.rows.length > 0 || existingApplication.rows.length > 0;
  }

  async getApplications(limit: number, offset: number) {
    const countRes = await pool.query(`SELECT COUNT(*) FROM "StudentApplication"`);
    const totalRecords = parseInt(countRes.rows[0].count, 10);

    const result = await pool.query(
      `SELECT * FROM "StudentApplication" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { rows: result.rows, totalRecords };
  }

  async approveApplication(id: string, user?: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const appRes = await client.query(`SELECT * FROM "StudentApplication" WHERE id = $1`, [id]);
      if (appRes.rows.length === 0) throw new Error('Application not found');
      const app = appRes.rows[0];
      if (app.status !== 'PENDING') throw new Error('Application is already processed');

      if (user && user.role === 'TEACHER') {
        const teacherRes = await client.query(`SELECT id FROM "Teacher" WHERE "userId" = $1`, [user.userId]);
        const teacher = teacherRes.rows[0];
        if (!teacher) throw new Error('Teacher profile not found');

        const ctRes = await client.query(
          `SELECT c.name as "className", s.name as "sectionName" 
           FROM "Section" s JOIN "Class" c ON s."classId" = c.id 
           WHERE s."classTeacherId" = $1`,
          [teacher.id]
        );
        const classTeacherOf = ctRes.rows.map((r: any) => `${r.className} ${r.sectionName}`.trim());
        const applyingFor = `${app.classApplying} ${app.section || ''}`.trim();

        if (!classTeacherOf.includes(applyingFor)) {
          throw new Error('Unauthorized: You are not the class teacher for this class/section');
        }
      }

      const studentEmail = `${app.scholarNumber}@sjs`;
      const studentPassword = app.dob.replace(/\//g, '');
      const studentHashed = await bcrypt.hash(studentPassword, 10);

      const suRes = await client.query(
        `INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, 'STUDENT', NOW(), NOW()) RETURNING id`,
        [studentEmail, studentHashed]
      );
      const studentUserId = suRes.rows[0].id;

      const parentEmail = `${app.scholarNumber}@parent`;
      const parentPassword = app.parentMobile;
      const parentHashed = await bcrypt.hash(parentPassword, 10);

      const puRes = await client.query(
        `INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, 'PARENT', NOW(), NOW()) RETURNING id`,
        [parentEmail, parentHashed]
      );
      const parentUserId = puRes.rows[0].id;

      const parentProfileRes = await client.query(
        `INSERT INTO "Parent" (id, "userId", "firstName", "lastName", phone, "secondaryPhone", email, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
        [parentUserId, app.fatherName, app.motherName, app.parentMobile, app.parentSecondaryMobile, app.parentEmail]
      );
      const parentProfileId = parentProfileRes.rows[0].id;

      const sRes = await client.query('SELECT id FROM "School" LIMIT 1');
      let schoolId = sRes.rows[0]?.id;
      if (!schoolId) {
        const ns = await client.query(`INSERT INTO "School" (id, name, "createdAt", "updatedAt") VALUES (gen_random_uuid(), 'SJS Public School', NOW(), NOW()) RETURNING id`);
        schoolId = ns.rows[0].id;
      }

      const parts = app.dob.split('/');
      let parsedDob = null;
      if (parts.length === 3) {
        parsedDob = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }

      // Look up sectionId from classApplying + section
      let sectionId = null;
      if (app.classApplying && app.section) {
        const secRes = await client.query(
          `SELECT sec.id FROM "Section" sec
           JOIN "Class" cls ON sec."classId" = cls.id
           WHERE cls.name = $1 AND sec.name = $2
           LIMIT 1`,
          [app.classApplying, app.section]
        );
        if (secRes.rows.length > 0) {
          sectionId = secRes.rows[0].id;
        }
      }

      await client.query(
        `INSERT INTO "Student" (id, "userId", "schoolId", "parentId", "sectionId", "firstName", "lastName", "scholarNumber", dob, gender, "rollNumber", address, "aadhaarNumber", "bloodGroup", "createdAt", "updatedAt", "profilePic", "useSchoolTransport", "transportId")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), $14, $15, $16)`,
        [
          studentUserId, schoolId, parentProfileId, sectionId, app.firstName, app.lastName, app.scholarNumber, parsedDob,
          app.gender || null, app.rollNumber || null, app.address || null, app.aadhaarNumber || null, app.bloodGroup || null,
          app.profilePic, app.useSchoolTransport || false, app.transportId || null
        ]
      );

      await client.query(`UPDATE "StudentApplication" SET status = 'APPROVED' WHERE id = $1`, [id]);
      await client.query('COMMIT');
      return { message: 'Approved successfully' };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async rejectApplication(id: string, user?: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const appRes = await client.query(`SELECT * FROM "StudentApplication" WHERE id = $1`, [id]);
      if (appRes.rows.length === 0) throw new Error('Application not found');
      const app = appRes.rows[0];

      if (user && user.role === 'TEACHER') {
        const teacherRes = await client.query(`SELECT id FROM "Teacher" WHERE "userId" = $1`, [user.userId]);
        const teacher = teacherRes.rows[0];
        if (!teacher) throw new Error('Teacher profile not found');

        const ctRes = await client.query(
          `SELECT c.name as "className", s.name as "sectionName" 
           FROM "Section" s JOIN "Class" c ON s."classId" = c.id 
           WHERE s."classTeacherId" = $1`,
          [teacher.id]
        );
        const classTeacherOf = ctRes.rows.map((r: any) => `${r.className} ${r.sectionName}`.trim());
        const applyingFor = `${app.classApplying} ${app.section || ''}`.trim();

        if (!classTeacherOf.includes(applyingFor)) {
          throw new Error('Unauthorized: You are not the class teacher for this class/section');
        }
      }

      await client.query(`UPDATE "StudentApplication" SET status = 'REJECTED' WHERE id = $1`, [id]);
      await client.query('COMMIT');
      return { message: 'Rejected successfully' };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

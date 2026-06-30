import { Request, Response } from 'express';
import pool from '../config/prisma';
import { handleError } from '../utils/errorHandler';

export class ClassController {
  getHierarchy = async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          c.id as "classId",
          c.name as "className",
          s.id as "sectionId",
          s.name as "sectionName",
          s."classTeacherId",
          t."firstName" as "teacherFirstName",
          t."lastName" as "teacherLastName",
          s."subjectTeachers",
          (SELECT COUNT(*) FROM "Student" st WHERE st."sectionId" = s.id AND st."isDeleted" = false) as "studentCount"
        FROM "Class" c
        JOIN "Section" s ON s."classId" = c.id
        LEFT JOIN "Teacher" t ON t.id = s."classTeacherId"
        ORDER BY 
          CASE c.name 
            WHEN 'PG' THEN 1
            WHEN 'Nursery' THEN 2
            WHEN 'KG' THEN 3
            WHEN '1' THEN 4
            WHEN '2' THEN 5
            WHEN '3' THEN 6
            WHEN '4' THEN 7
            WHEN '5' THEN 8
            WHEN '6' THEN 9
            WHEN '7' THEN 10
            WHEN '8' THEN 11
            WHEN '9' THEN 12
            WHEN '10' THEN 13
            WHEN '11' THEN 14
            WHEN '12' THEN 15
            ELSE 99
          END,
          s.name ASC
      `;
      const result = await pool.query(query);

      // Group by class
      const classesMap: any = {};
      const gradeOrder = ['PG', 'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

      for (const row of result.rows) {
        if (!classesMap[row.className]) {
          classesMap[row.className] = {
            classId: row.classId,
            className: row.className,
            sections: []
          };
        }

        let subjectTeachersObj = {};
        try {
          if (row.subjectTeachers) {
            subjectTeachersObj = JSON.parse(row.subjectTeachers);
          }
        } catch {}

        classesMap[row.className].sections.push({
          sectionId: row.sectionId,
          sectionName: row.sectionName,
          classTeacherId: row.classTeacherId,
          classTeacherName: row.teacherFirstName ? `${row.teacherFirstName} ${row.teacherLastName}` : null,
          subjectTeachers: subjectTeachersObj,
          studentCount: parseInt(row.studentCount) || 0
        });
      }

      const hierarchy = gradeOrder.map(g => classesMap[g]).filter(Boolean);
      res.status(200).json(hierarchy);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  assignClassTeacher = async (req: Request, res: Response) => {
    try {
      const { sectionId } = req.params;
      const { teacherId } = req.body;

      const sectionRes = await pool.query(
        `SELECT s."classTeacherId", s.name as "sectionName", c.name as "className" 
         FROM "Section" s JOIN "Class" c ON s."classId" = c.id WHERE s.id = $1`,
        [sectionId]
      );

      if (sectionRes.rows.length === 0) throw new Error('Section not found');

      const oldTeacherId = sectionRes.rows[0].classTeacherId;
      const classStr = `${sectionRes.rows[0].className}-${sectionRes.rows[0].sectionName}`;

      await pool.query(
        `UPDATE "Section" SET "classTeacherId" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [teacherId || null, sectionId]
      );

      // Remove from old teacher
      if (oldTeacherId && oldTeacherId !== teacherId) {
        const oldTeacherRes = await pool.query(`SELECT classes FROM "Teacher" WHERE id = $1`, [oldTeacherId]);
        if (oldTeacherRes.rows.length > 0) {
          let currentClasses = oldTeacherRes.rows[0].classes || "";
          if (currentClasses.includes(classStr)) {
            const classArray = currentClasses.split(',').map((c: string) => c.trim()).filter((c: string) => c !== classStr && c !== '');
            const newClasses = classArray.join(', ');
            await pool.query(`UPDATE "Teacher" SET classes = $1, "updatedAt" = NOW() WHERE id = $2`, [newClasses, oldTeacherId]);
          }
        }
      }

      // Add to new teacher
      if (teacherId && oldTeacherId !== teacherId) {
        const newTeacherRes = await pool.query(`SELECT classes FROM "Teacher" WHERE id = $1`, [teacherId]);
        if (newTeacherRes.rows.length > 0) {
          let currentClasses = newTeacherRes.rows[0].classes || "";
          if (!currentClasses.includes(classStr)) {
            const newClasses = currentClasses ? `${currentClasses}, ${classStr}` : classStr;
            await pool.query(`UPDATE "Teacher" SET classes = $1, "updatedAt" = NOW() WHERE id = $2`, [newClasses, teacherId]);
          }
        }
      }

      res.status(200).json({ message: 'Class teacher assigned successfully' });
    } catch (error: any) {
      handleError(res, error);
    }
  };

  assignSubjectTeacher = async (req: Request, res: Response) => {
    try {
      const { sectionId } = req.params;
      const { subject, teacherId, teacherName } = req.body;

      // Get current subjects
      const curRes = await pool.query(`SELECT "subjectTeachers" FROM "Section" WHERE id = $1`, [sectionId]);
      let subjObj: any = {};
      try {
        if (curRes.rows[0]?.subjectTeachers) {
          subjObj = JSON.parse(curRes.rows[0].subjectTeachers);
        }
      } catch {}

      if (!teacherId) {
        delete subjObj[subject];
      } else {
        subjObj[subject] = { teacherId, teacherName };
      }

      await pool.query(
        `UPDATE "Section" SET "subjectTeachers" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [JSON.stringify(subjObj), sectionId]
      );

      res.status(200).json({ message: 'Subject teacher assigned successfully', subjectTeachers: subjObj });
    } catch (error: any) {
      handleError(res, error);
    }
  };

  getSectionStudents = async (req: Request, res: Response) => {
    try {
      const { sectionId } = req.params;
      const result = await pool.query(
        `SELECT id, "firstName", "lastName", "scholarNumber", dob 
         FROM "Student" 
         WHERE "sectionId" = $1 AND "isDeleted" = false 
         ORDER BY "firstName" ASC`,
        [sectionId]
      );
      res.status(200).json(result.rows);
    } catch (error: any) {
      handleError(res, error);
    }
  };
}

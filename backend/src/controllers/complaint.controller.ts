import pool from '../config/prisma';
import { parsePaginationParams, formatPaginatedResponse } from '../utils/pagination';
import { PushService } from '../services/push.service';

export const createComplaint = async (req: any, res: any) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { subject, description, isAnonymous } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    // Role determines applicant type
    const role = user.role;
    let applicantId = '';

    if (role === 'STUDENT') {
      const studentRes = await pool.query('SELECT id FROM "Student" WHERE "userId" = $1', [user.userId]);
      if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
      applicantId = studentRes.rows[0].id;
    } else if (role === 'TEACHER') {
      const teacherRes = await pool.query('SELECT id FROM "Teacher" WHERE "userId" = $1', [user.userId]);
      if (teacherRes.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
      applicantId = teacherRes.rows[0].id;
    } else {
      return res.status(403).json({ error: 'Role not authorized to submit complaints' });
    }

    // Teachers cannot submit anonymously
    const finalAnonymous = role === 'TEACHER' ? false : Boolean(isAnonymous);

    const insertRes = await pool.query(
      `INSERT INTO "Complaint" ("id", "subject", "description", "isAnonymous", "role", "applicantId", "status", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'UNSEEN', NOW(), NOW()) RETURNING *`,
      [subject, description, finalAnonymous, role, applicantId]
    );

    // Alert the principal about the new complaint
    PushService.sendToPrincipals(
      'New Complaint Received',
      `${role} filed a complaint: ${subject}`
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyComplaints = async (req: any, res: any) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const role = user.role;
    let applicantId = '';

    if (role === 'STUDENT') {
      const studentRes = await pool.query('SELECT id FROM "Student" WHERE "userId" = $1', [user.userId]);
      if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
      applicantId = studentRes.rows[0].id;
    } else if (role === 'TEACHER') {
      const teacherRes = await pool.query('SELECT id FROM "Teacher" WHERE "userId" = $1', [user.userId]);
      if (teacherRes.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
      applicantId = teacherRes.rows[0].id;
    } else {
      return res.status(403).json({ error: 'Role not authorized to view complaints' });
    }

    const pageParams = parsePaginationParams(req);

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM "Complaint" WHERE "applicantId" = $1 AND "role" = $2',
      [applicantId, role]
    );
    const totalRecords = parseInt(countRes.rows[0].count, 10);

    const complaintsRes = await pool.query(
      'SELECT * FROM "Complaint" WHERE "applicantId" = $1 AND "role" = $2 ORDER BY "createdAt" DESC LIMIT $3 OFFSET $4',
      [applicantId, role, pageParams.limit, pageParams.offset]
    );

    res.json(formatPaginatedResponse(complaintsRes.rows, totalRecords, pageParams));
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllComplaints = async (req: any, res: any) => {
  try {
    // Only PRINCIPAL or SUPER_ADMIN
    const user = req.user;
    if (user.role !== 'PRINCIPAL' && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const pageParams = parsePaginationParams(req);

    const countRes = await pool.query('SELECT COUNT(*) FROM "Complaint"');
    const totalRecords = parseInt(countRes.rows[0].count, 10);

    const complaintsRes = await pool.query(
      'SELECT * FROM "Complaint" ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2',
      [pageParams.limit, pageParams.offset]
    );
    const complaints = complaintsRes.rows;

    // Populate applicant details manually and mask anonymous ones
    const populated = await Promise.all(complaints.map(async (c: any) => {
      let applicantDetails = null;
      
      if (!c.isAnonymous) {
        if (c.role === 'STUDENT') {
          const studentRes = await pool.query('SELECT "firstName", "lastName", "scholarNumber" FROM "Student" WHERE "id" = $1', [c.applicantId]);
          if (studentRes.rows.length > 0) {
            const student = studentRes.rows[0];
            applicantDetails = { name: `${student.firstName} ${student.lastName}`, extra: `Scholar No: ${student.scholarNumber}` };
          }
        } else if (c.role === 'TEACHER') {
          const teacherRes = await pool.query('SELECT "firstName", "lastName", "subject" FROM "Teacher" WHERE "id" = $1', [c.applicantId]);
          if (teacherRes.rows.length > 0) {
            const teacher = teacherRes.rows[0];
            applicantDetails = { name: `${teacher.firstName} ${teacher.lastName}`, extra: `Subject: ${teacher.subject}` };
          }
        }
      }

      return {
        ...c,
        applicant: c.isAnonymous ? { name: 'Anonymous Student', extra: '' } : applicantDetails
      };
    }));

    res.json(formatPaginatedResponse(populated, totalRecords, pageParams));
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateComplaintStatus = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (user.role !== 'PRINCIPAL' && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!['UNSEEN', 'SEEN', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateRes = await pool.query(
      'UPDATE "Complaint" SET "status" = $1, "updatedAt" = NOW() WHERE "id" = $2 RETURNING *',
      [status, id]
    );

    res.json(updateRes.rows[0]);
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

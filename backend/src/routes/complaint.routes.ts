import express from 'express';
import { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus } from '../controllers/complaint.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authMiddleware);

// Students and Teachers can create and view their own complaints
router.post('/', requireRole(['STUDENT', 'TEACHER']), createComplaint);
router.get('/', requireRole(['STUDENT', 'TEACHER']), getMyComplaints);

// Principal can view all and update status
router.get('/all', requireRole(['PRINCIPAL', 'SUPER_ADMIN']), getAllComplaints);
router.post('/:id/status', requireRole(['PRINCIPAL', 'SUPER_ADMIN']), updateComplaintStatus);

export default router;

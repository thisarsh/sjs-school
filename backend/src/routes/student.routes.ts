import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const studentController = new StudentController();

// Public routes
router.get('/check-scholar-number', studentController.checkScholarNumber);
router.post('/apply', studentController.apply);

// Apply auth middleware to all student routes
router.use(authMiddleware);

router.get('/me', requireRole(['STUDENT']), studentController.getMe);

router.get('/applications', requireRole(['TEACHER', 'PRINCIPAL']), studentController.getApplications);
router.post('/applications/:id/approve', requireRole(['TEACHER', 'PRINCIPAL']), studentController.approveApplication);
router.post('/applications/:id/reject', requireRole(['TEACHER', 'PRINCIPAL']), studentController.rejectApplication);

router.get('/', requireRole(['PRINCIPAL', 'TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), studentController.getAll);
router.get('/:id', requireRole(['PRINCIPAL', 'TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), studentController.getById);

// Only admins can create/update/delete
router.post('/', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), studentController.create);
router.put('/:id', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), studentController.update);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), studentController.delete);

export default router;

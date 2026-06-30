import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const teacherController = new TeacherController();

// Public route for teacher application (via Google Form webhook or web portal)
router.post('/apply', teacherController.apply);

// Protected routes
router.use(authMiddleware);

router.get('/applications', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), teacherController.getApplications);
router.post('/applications/:id/approve', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), teacherController.approveApplication);
router.post('/applications/:id/reject', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), teacherController.rejectApplication);

router.get('/me', requireRole(['TEACHER']), teacherController.getMe);
router.put('/me', requireRole(['TEACHER']), teacherController.updateMe);
router.get('/', requireRole(['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), teacherController.getAll);
router.get('/:id', requireRole(['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), teacherController.getById);

router.post('/', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), teacherController.create);
router.put('/:id', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), teacherController.update);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), teacherController.delete);

export default router;

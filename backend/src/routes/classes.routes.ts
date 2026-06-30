import { Router } from 'express';
import { ClassController } from '../controllers/class.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const classController = new ClassController();

router.use(authMiddleware);

router.get('/hierarchy', requireRole(['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']), classController.getHierarchy);
router.post('/section/:sectionId/class-teacher', requireRole(['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), classController.assignClassTeacher);
router.post('/section/:sectionId/subject-teacher', requireRole(['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), classController.assignSubjectTeacher);
router.get('/section/:sectionId/students', requireRole(['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']), classController.getSectionStudents);

export default router;

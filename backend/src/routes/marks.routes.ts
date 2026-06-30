import { Router } from 'express';
import { MarksController } from '../controllers/marks.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const controller = new MarksController();

router.use(authMiddleware);

router.get('/', requireRole(['PRINCIPAL', 'TEACHER', 'SUPER_ADMIN']), controller.getMarks);
router.get('/:studentId', controller.getStudentMarks);
router.post('/', requireRole(['PRINCIPAL', 'TEACHER', 'SUPER_ADMIN']), controller.upsertMarks);

export default router;

import { Router } from 'express';
import { SubjectController } from '../controllers/subject.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const controller = new SubjectController();

router.use(authMiddleware);

router.get('/', controller.getSubjects);
router.post('/', requireRole(['PRINCIPAL', 'SUPER_ADMIN']), controller.createSubject);
router.delete('/:id', requireRole(['PRINCIPAL', 'SUPER_ADMIN']), controller.deleteSubject);

export default router;

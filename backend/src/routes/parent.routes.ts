import { Router } from 'express';
import { ParentController } from '../controllers/parent.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const parentController = new ParentController();

router.use(authMiddleware);

router.get('/', requireRole(['PRINCIPAL', 'TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), parentController.getAll);
router.get('/:id', requireRole(['PRINCIPAL', 'TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), parentController.getById);

router.post('/', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), parentController.create);
router.put('/:id', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), parentController.update);
router.delete('/:id', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']), parentController.delete);

export default router;

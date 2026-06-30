import { Router } from 'express';
import { NoticeController } from '../controllers/notice.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const controller = new NoticeController();

router.use(authMiddleware);

router.get('/', controller.getNotices);
router.post('/', requireRole(['PRINCIPAL', 'SUPER_ADMIN', 'SCHOOL_ADMIN']), controller.createNotice);
router.post('/mark-read', controller.markRead);

export default router;

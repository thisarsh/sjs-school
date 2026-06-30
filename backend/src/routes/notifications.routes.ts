import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const controller = new NotificationsController();

router.use(authMiddleware);

router.get('/', controller.getNotifications);
router.post('/', requireRole(['PRINCIPAL', 'TEACHER', 'SUPER_ADMIN']), controller.createNotification);
router.delete('/:id', requireRole(['PRINCIPAL', 'SUPER_ADMIN']), controller.deleteNotification);

export default router;

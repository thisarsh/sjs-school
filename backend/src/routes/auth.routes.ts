import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.post('/push-token', authMiddleware, authController.updatePushToken);

export default router;

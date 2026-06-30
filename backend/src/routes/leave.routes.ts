import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const leaveController = new LeaveController();

// Debug Push Env
router.get('/debug-push-env', leaveController.debugPushEnv.bind(leaveController));

// Create a new leave request (Students/Teachers)
router.post('/', authMiddleware, leaveController.applyLeave.bind(leaveController));

// Get my own leave requests (Students/Teachers)
router.get('/', authMiddleware, leaveController.getMyLeaves.bind(leaveController));

// Get all leave requests (Principals)
router.get('/all', authMiddleware, leaveController.getAllLeaves.bind(leaveController));

// Approve or reject a leave request (Principals)
router.post('/:id/status', authMiddleware, leaveController.updateLeaveStatus.bind(leaveController));

export default router;

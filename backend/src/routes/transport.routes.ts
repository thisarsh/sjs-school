import { Router } from 'express';
import { TransportController } from '../controllers/transport.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const transportController = new TransportController();

// GET /api/transport - All authenticated users can view transport routes
router.get('/', authMiddleware, transportController.getTransports);

// POST /api/transport - Only Principals, School Admins, and Superadmins can create
router.post(
  '/',
  authMiddleware,
  requireRole(['PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN']),
  transportController.createTransport
);

// PUT /api/transport/:id - Only Principals, School Admins, and Superadmins can update
router.put(
  '/:id',
  authMiddleware,
  requireRole(['PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN']),
  transportController.updateTransport
);

// DELETE /api/transport/:id - Only Principals, School Admins, and Superadmins can delete
router.delete(
  '/:id',
  authMiddleware,
  requireRole(['PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN']),
  transportController.deleteTransport
);

export default router;

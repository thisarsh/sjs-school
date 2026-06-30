import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { UploadController } from '../controllers/upload.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const uploadController = new UploadController();

// Limiters
const profileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 profile uploads per hour per user/IP
  message: { error: 'Too many profile image uploads, please try again later' }
});

const appPhotoUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // max 3 application photo uploads per hour per IP
  message: { error: 'Too many application photo uploads, please try again later' }
});

// Use memory storage for multer with 10MB limit and image file validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// 1. Authenticated Profile Photo Upload (Strict permissions)
router.post(
  '/profile',
  authMiddleware,
  requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT']),
  profileUploadLimiter,
  upload.single('image'),
  uploadController.uploadImage
);

// 2. Public Application Photo Upload (No auth, highly rate-limited)
router.post(
  '/application-photo',
  appPhotoUploadLimiter,
  upload.single('image'),
  uploadController.uploadImage
);

export default router;

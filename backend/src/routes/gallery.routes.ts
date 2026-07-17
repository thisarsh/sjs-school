import { Router } from 'express';
import multer from 'multer';
import { GalleryController } from '../controllers/gallery.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const galleryController = new GalleryController();

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

// GET /api/gallery - All authenticated users can view the gallery
router.get('/', authMiddleware, galleryController.getImages);

// POST /api/gallery - Only Teachers, Principals, School Admins, and Superadmins can upload images
router.post(
  '/',
  authMiddleware,
  requireRole(['TEACHER', 'PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN']),
  (req, res, next) => {
    upload.single('image')(req, res, (err: any) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message || 'Image upload error' });
      }
      next();
    });
  },
  galleryController.createImage
);

// DELETE /api/gallery/:id - Only Teachers, Principals, School Admins, and Superadmins can delete images
router.delete(
  '/:id',
  authMiddleware,
  requireRole(['TEACHER', 'PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN']),
  galleryController.deleteImage
);

export default router;

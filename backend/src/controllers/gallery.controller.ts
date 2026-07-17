import { Request, Response } from 'express';
import pool from '../config/prisma';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { handleError } from '../utils/errorHandler';

const uploadToCloudinary = (fileBuffer: Buffer): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'erp_gallery', format: 'webp' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

export class GalleryController {
  async getImages(req: Request, res: Response) {
    try {
      const result = await pool.query(
        `SELECT g.id, g.url, g."publicId", g.description, g."uploadedById", g."createdAt",
                u.email, u.role,
                CASE 
                  WHEN u.role = 'TEACHER' THEN (SELECT CONCAT(t."firstName", ' ', t."lastName") FROM "Teacher" t WHERE t."userId" = u.id)
                  WHEN u.role = 'PRINCIPAL' THEN 'Principal'
                  WHEN u.role = 'SUPER_ADMIN' THEN 'Super Admin'
                  ELSE 'Staff'
                END as "uploadedByName"
         FROM "GalleryImage" g
         LEFT JOIN "User" u ON g."uploadedById" = u.id
         ORDER BY g."createdAt" DESC`
      );
      res.status(200).json({ data: result.rows });
    } catch (error: any) {
      console.error('Error in getImages:', error);
      handleError(res, error);
    }
  }

  async createImage(req: any, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { description } = req.body;

      // 1. Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer);
      const imageUrl = result.secure_url;
      const publicId = result.public_id;

      // 2. Insert into database
      const insertResult = await pool.query(
        `INSERT INTO "GalleryImage" (id, url, "publicId", description, "uploadedById", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
         RETURNING *`,
        [imageUrl, publicId, description || null, user.userId]
      );

      res.status(201).json({ data: insertResult.rows[0] });
    } catch (error: any) {
      console.error('Error in createImage:', error);
      handleError(res, error);
    }
  }

  async deleteImage(req: any, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;

      // Fetch image first to get publicId
      const imageResult = await pool.query(
        'SELECT * FROM "GalleryImage" WHERE id = $1',
        [id]
      );

      if (imageResult.rows.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const image = imageResult.rows[0];

      // Delete from Cloudinary if publicId exists
      if (image.publicId) {
        try {
          await cloudinary.uploader.destroy(image.publicId);
        } catch (cloudErr) {
          console.error('Failed to delete from Cloudinary:', cloudErr);
          // We proceed with database deletion even if Cloudinary fails
        }
      }

      // Delete from database
      await pool.query(
        'DELETE FROM "GalleryImage" WHERE id = $1',
        [id]
      );

      res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error: any) {
      console.error('Error in deleteImage:', error);
      handleError(res, error);
    }
  }
}

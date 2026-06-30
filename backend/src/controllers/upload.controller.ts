import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import { handleError } from '../utils/errorHandler';

export class UploadController {
  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Stream the buffer from multer directly to cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'erp_profiles', format: 'webp' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ error: 'Failed to upload image' });
          }
          if (result) {
            return res.status(200).json({ url: result.secure_url });
          }
        }
      );

      // Convert buffer to stream and pipe to cloudinary
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);

    } catch (error: any) {
      handleError(res, error);
    }
  }
}

const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  try {
    console.log('Cloudinary Config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'present' : 'missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'present' : 'missing',
    });

    console.log('Uploading dummy buffer to Cloudinary...');
    const dummyBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const uploadPromise = () => new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'erp_gallery', format: 'webp' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      const { Readable } = require('stream');
      const bufferStream = new Readable();
      bufferStream.push(dummyBuffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });

    const res = await uploadPromise();
    console.log('UPLOAD SUCCESS:', res);

    console.log('Deleting uploaded image...');
    const delRes = await cloudinary.uploader.destroy(res.public_id);
    console.log('DELETE SUCCESS:', delRes);

  } catch (err) {
    console.error('CLOUDINARY ERROR:', err);
  }
}

run();

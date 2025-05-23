// utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Debug kiểm tra biến môi trường
console.log('🌐 Cloudinary Config:');
console.log('cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('api_key:', process.env.CLOUDINARY_API_KEY);
console.log('api_secret:', process.env.CLOUDINARY_API_SECRET ? '✅ OK' : '❌ Missing');

cloudinary.config({
  cloud_name: 'dhuoudwdn',
  api_key: '264352827729976',
  api_secret: 'eMmzFgqNt3OxS_SgPUlRSt_T73I',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tour_images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

export { cloudinary, storage };

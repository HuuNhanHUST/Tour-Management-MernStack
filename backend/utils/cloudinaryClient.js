// utils/cloudinaryClient.js
import { v2 as cloudinary } from 'cloudinary';

// 🔥 Gán trực tiếp ở đây (bỏ dotenv để chắc chắn)
cloudinary.config({
  cloud_name: 'dhuoudwdn',
  api_key: '264352827729976',
  api_secret: 'eMmzFgqNt3OxS_SgPUlRSt_T73I',
});

export default cloudinary;

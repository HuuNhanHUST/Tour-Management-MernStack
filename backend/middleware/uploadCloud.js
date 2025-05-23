// middleware/uploadCloud.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinaryClient.js'; // ✅ Import đúng config

const storage = new CloudinaryStorage({
  cloudinary, // <-- Đã được config từ file riêng
  params: {
    folder: 'tour_images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const uploadCloud = multer({ storage });
export default uploadCloud;

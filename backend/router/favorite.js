import express from 'express';
import Favorite from '../models/Favorite.js';

const router = express.Router();

// GET - Danh sách tour yêu thích của user
router.get('/:userId/favorites', async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.params.userId }).populate('tourId');
    const tours = favorites.map(fav => fav.tourId);
    res.status(200).json({ favorites: tours });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// POST - Thêm tour yêu thích
router.post('/:userId/favorites', async (req, res) => {
  const { tourId } = req.body;
  try {
    const exists = await Favorite.findOne({ userId: req.params.userId, tourId });
    if (exists) {
      return res.status(400).json({ message: 'Tour đã được yêu thích' });
    }

    const favorite = new Favorite({ userId: req.params.userId, tourId });
    await favorite.save();
    res.status(201).json({ message: 'Đã thêm tour vào yêu thích' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// DELETE - Xoá tour yêu thích
router.delete('/:userId/favorites', async (req, res) => {
  const { tourId } = req.body;
  try {
    await Favorite.findOneAndDelete({ userId: req.params.userId, tourId });
    res.status(200).json({ message: 'Đã xóa tour khỏi yêu thích' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

export default router;

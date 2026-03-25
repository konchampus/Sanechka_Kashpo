const express = require('express');
const router = express.Router();
const { getPhotos, uploadPhoto, deletePhoto } = require('../controllers/photos');
const { auth, admin, upload } = require('../middleware');
const multer = require('multer');

// Middleware для обработки ошибок multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Ошибка Multer:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой (максимум 5MB)' });
    }
    return res.status(400).json({ error: 'Ошибка загрузки файла' });
  } else if (err) {
    console.error('Ошибка загрузки:', err);
    return res.status(400).json({ error: err.message });
  }
  next();
};

router.get('/', getPhotos);
router.post('/', auth, admin, upload.single('photo'), handleMulterError, uploadPhoto);
router.delete('/:id', auth, admin, deletePhoto);

// legacy admin routes for compatibility
router.post('/admin/photos', auth, admin, upload.single('photo'), handleMulterError, uploadPhoto);
router.delete('/admin/photos/:id', auth, admin, deletePhoto);

module.exports = router; 
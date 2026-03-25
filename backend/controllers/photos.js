let Photo;
try {
  Photo = require('../models/Photo');
} catch (error) {
  console.error('Ошибка импорта модели Photo:', error);
  Photo = null;
}

const fs = require('fs');
const path = require('path');

exports.getPhotos = async (req, res) => {
  try {
    if (!Photo) {
      return res.status(500).json({ error: 'Модель Photo не найдена' });
    }
    const photos = await Photo.find();
    res.json(photos);
  } catch (error) {
    console.error('Ошибка получения фотографий:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!Photo) {
      return res.status(500).json({ error: 'Модель Photo не найдена' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    const { name } = req.body;
    const filename = req.file.filename;
    const url = `/api/images/${encodeURIComponent(filename)}`;
    const photo = new Photo({ url, name });
    await photo.save();
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    if (!Photo) return res.status(500).json({ error: 'Модель Photo не найдена' });
    const photo = await Photo.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Фото не найдено' });
    // Удаляем файл с диска
    const filename = decodeURIComponent(photo.url.split('/').pop());
    if (/^[\w\d\-\.]+$/.test(filename)) {
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: 'Фото удалено' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
}; 
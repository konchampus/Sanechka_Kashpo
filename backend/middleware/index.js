const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папку uploads, если её нет
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Транслитерация и очистка имени файла
const translit = str =>
  str.normalize('NFD')
    .replace(/[ -\u036f]/g, '')
    .replace(/[а-яё]/gi, ch => ({
      'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
    }[ch.toLowerCase()] || ch))
    .replace(/[^a-z0-9_.-]/gi, '_');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Загрузка файла:', file.originalname);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext);
    const safeName = translit(base) + ext;
    const uniqueName = `${Date.now()}-${safeName}`;
    console.log('Создание файла:', uniqueName);
    cb(null, uniqueName);
  }
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    console.error('Неподдерживаемый тип файла:', mimeType, ext);
    cb(new Error('Неподдерживаемый тип файла. Разрешены только изображения и видео.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB максимум
});

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(401).json({ error: 'Неверный токен' });
  }
};

const admin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещен' });
  next();
};

module.exports = { auth, admin, upload }; 
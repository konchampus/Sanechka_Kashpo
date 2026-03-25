const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Telegraf } = require('telegraf');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
require('dotenv').config();
const { Readable } = require('stream');
// const Iconv = require('iconv').Iconv; // УДАЛЕНО!

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ВОССТАНАВЛИВАЮ прямую раздачу папки uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Удаляю прокси-роут /api/images/:filename

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5000", "http://127.0.0.1:5000"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:3000", "http://127.0.0.1:3000"]
    }
  }
}));
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // ОТКЛЮЧЕНО для dev, чтобы не было 429

// Простая ручная защита от NoSQL-инъекций и XSS
app.use((req, res, next) => {
  const sanitize = obj => {
    for (const key in obj) {
      // NoSQL injection: удаляем ключи с $ и .
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      } else if (typeof obj[key] === 'string') {
        // XSS: экранируем < > " ' &
        obj[key] = obj[key]
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }
    }
  };
  ['body', 'query', 'params'].forEach(k => req[k] && sanitize(req[k]));
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя из цифр и расширения
    const fileExt = path.extname(file.originalname);
    const finalFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    cb(null, finalFilename);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB подключен'))
  .catch(err => console.error('MongoDB ошибка:', err));

// Схемы
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  name: String,
  surname: String,
  phone: String,
  whatsapp: Boolean,
  address: String,
  city: String,
  deliveryMethod: String,
  role: { type: String, default: 'user' }
});
const productSchema = new mongoose.Schema({
  productId: { type: String, unique: true, sparse: true }, // 12-значный id
  name: String,
  description: String,
  price: Number,
  images: [String],
  videos: [String],
  category: String,
  color: String,
  options: [{ name: String, enabled: Boolean, price: Number }],
  characteristics: [{ key: String, value: String }],
  stock: Number
});
const orderSchema = new mongoose.Schema({
  orderNumber: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestData: {
    name: String,
    surname: String,
    phone: String,
    whatsapp: Boolean,
    address: String,
    city: String,
    deliveryMethod: String
  },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }],
  totalPrice: Number,
  promoCode: String,
  discount: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const bannerSchema = new mongoose.Schema({ image: String, video: String, title: String });
const promoCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  discount: Number,
  minOrder: Number,
  usageLimit: Number,
  used: { type: Number, default: 0 }
});
const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: Number,
  comment: String,
  createdAt: { type: Date, default: Date.now }
});
const visitSchema = new mongoose.Schema({
  date: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ip: String
});
const orderCounterSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: { type: Number, default: 0 }
});
const analyticsEventSchema = new mongoose.Schema({
  userId: { type: String },
  ip: { type: String },
  type: { type: String, required: true },
  page: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  referrer: { type: String },
  userAgent: { type: String },
  details: { type: Object }
});
const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Banner = mongoose.model('Banner', bannerSchema);
const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
const Review = mongoose.model('Review', reviewSchema);
const Visit = mongoose.model('Visit', visitSchema);
const OrderCounter = mongoose.model('OrderCounter', orderCounterSchema);

let bot;
if (process.env.NODE_ENV !== 'test') {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  bot.start((ctx) => ctx.reply('Добро пожаловать в SanRottan!'));
  bot.launch().then(() => console.log('Telegram бот запущен')).catch(err => console.error('Telegram ошибка:', err));
}

// Middleware для проверки JWT
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Неверный токен' });
  }
};

// Middleware для админа
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещен' });
  next();
};

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, surname, phone, whatsapp, address, city, deliveryMethod } = req.body;
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const user = new User({
      email,
      password: hashedPassword,
      name,
      surname,
      phone,
      whatsapp,
      address,
      city,
      deliveryMethod
    });
    await user.save();
    // Перенос заказов гостя в профиль по совпадающему телефону
    if (phone) {
      await Order.updateMany(
        { 'guestData.phone': phone, userId: null },
        { $set: { userId: user._id } }
      );
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '14d' });
    res.json({ token });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Логин
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '14d' });
    res.json({ token, role: user.role });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение профиля
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Ошибка профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление профиля
app.put('/api/auth/me', auth, async (req, res) => {
  try {
    const { name, surname, phone, whatsapp, address, city, deliveryMethod } = req.body;
    await User.findByIdAndUpdate(req.user.id, { name, surname, phone, whatsapp, address, city, deliveryMethod });
    res.json({ message: 'Профиль обновлен' });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Продукты
app.get('/api/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (search) query.name = new RegExp(search, 'i');
    if (category) query.category = category;
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/products/by-id/:id12', async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.id12 });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/admin/products', auth, admin, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), async (req, res) => {
  try {
    // ЛОГИРОВАНИЕ ЗАГРУЗКИ ФАЙЛОВ
    console.log('=== ЗАГРУЗКА ТОВАРА ===');
    console.log('req.body:', req.body);
    if (req.files) {
      if (req.files.images) {
        console.log('Загружено изображений:', req.files.images.length);
        req.files.images.forEach((f, i) => console.log(`  [${i}]`, f.originalname, f.filename, f.size, 'байт'));
      } else {
        console.log('Нет изображений');
      }
      if (req.files.videos) {
        console.log('Загружено видео:', req.files.videos.length);
        req.files.videos.forEach((f, i) => console.log(`  [${i}]`, f.originalname, f.filename, f.size, 'байт'));
      } else {
        console.log('Нет видео');
      }
    } else {
      console.log('req.files отсутствует');
    }

    const { name, description, price, category, color, options, characteristics, stock } = req.body;

    const getArray = (field) => {
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') return field.split(',').map(s => s.trim());
      return [];
    };

    const images = req.files && req.files.images
      ? req.files.images.map(file => `/uploads/${file.filename}`)
      : getArray(req.body.images);
    const videos = req.files && req.files.videos
      ? req.files.videos.map(file => `/uploads/${file.filename}`)
      : getArray(req.body.videos);

    // Генерация уникального 12-значного id
    let productId;
    while (true) {
      productId = String(Math.floor(100000000000 + Math.random() * 900000000000));
      const exists = await Product.findOne({ productId });
      if (!exists) break;
    }
    const product = new Product({
      productId,
      name,
      description,
      price,
      images,
      videos,
      category,
      color,
      options: req.body.options || [],
      characteristics: req.body.characteristics || [],
      stock
    });
    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Ошибка добавления товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/admin/products/:id', auth, admin, async (req, res) => {
  try {
    const update = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/products/:id', auth, admin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Товар удалён' });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Заказы
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, guestData, products, promoCode } = req.body;
    let discount = 0;
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode });
      if (promo && promo.used < promo.usageLimit) {
        discount = promo.discount;
        promo.used += 1;
        await promo.save();
      }
    }
    // Получаем объекты товаров по id
    const populatedProducts = await Promise.all(products.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product) throw new Error('Товар не найден');
      return { product, quantity: item.quantity };
    }));
    const totalPrice = populatedProducts.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * (1 - discount / 100);
    // Новый автоинкрементный номер заказа
    let orderNumber;
    let counter = await OrderCounter.findOneAndUpdate(
      { key: 'orderNumber' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    orderNumber = counter.value;
    const order = new Order({
      orderNumber,
      userId,
      guestData,
      products: populatedProducts.map(p => ({ product: p.product._id, quantity: p.quantity })),
      totalPrice,
      promoCode,
      discount
    });
    await order.save();
    // --- Уменьшаем остатки ---
    for (const item of populatedProducts) {
      if (typeof item.product.stock === 'number') {
        item.product.stock = Math.max(0, item.product.stock - item.quantity);
        await item.product.save();
      }
    }
    let userInfo = '';
    if (userId) {
      const user = await User.findById(userId);
      userInfo = `👤 <b>${user.name || ''} ${user.surname || ''}</b>\n📞 <a href='tel:${user.phone}'>${user.phone || ''}</a>\nГород: ${user.city || ''}\nАдрес: ${user.address || ''}`;
    } else if (guestData) {
      userInfo = `👤 <b>${guestData.name || ''} ${guestData.surname || ''}</b>\n📞 <a href='tel:${guestData.phone}'>${guestData.phone || ''}</a>\nГород: ${guestData.city || ''}\nАдрес: ${guestData.address || ''}`;
    }
    const orderLink = process.env.ADMIN_ORDER_URL ? `${process.env.ADMIN_ORDER_URL}/admin/orders` : 'https://sanrottan.ru/admin/orders';
    const message = `<b>🆕 Новый заказ №${orderNumber}</b>\n\n${userInfo}\n\n<b>Товары:</b>\n${populatedProducts.map(p => `• <b>${p.product?.name || 'Товар'}</b> x${p.quantity} = ${p.product?.price * p.quantity || 0} руб.`).join('\n')}\n\n<b>Промокод:</b> ${promoCode || '—'}\n<b>Итого:</b> ${totalPrice} руб.\n\n<a href='${orderLink}'>Открыть в админке</a>`;
    try {
      if (bot) {
        await bot.telegram.sendMessage(process.env.ADMIN_TELEGRAM_ID, message, { parse_mode: 'HTML', disable_web_page_preview: true });
      }
    } catch (tgErr) {
      console.error('Ошибка Telegram:', tgErr);
    }
    res.json({ orderNumber });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate('products.product');
    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/orders', auth, admin, async (req, res) => {
  try {
    const orders = await Order.find().populate('products.product');
    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/admin/orders/:id', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'Статус обновлен' });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Привязка guest-заказов к userId по телефону/email
app.post('/api/orders/claim-guest-orders', auth, async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone && !email) return res.status(400).json({ error: 'Не указан телефон или email' });
    const userId = req.user.id;
    let updated = 0;
    if (phone) {
      const r = await Order.updateMany({ 'guestData.phone': phone, userId: null }, { $set: { userId } });
      updated += r.modifiedCount || r.nModified || 0;
    }
    if (email) {
      const r = await Order.updateMany({ 'guestData.email': email, userId: null }, { $set: { userId } });
      updated += r.modifiedCount || r.nModified || 0;
    }
    res.json({ updated });
  } catch (error) {
    console.error('Ошибка claim-guest-orders:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Баннеры
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find();
    res.json(banners);
  } catch (error) {
    console.error('Ошибка получения баннеров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/admin/banners', auth, admin, async (req, res) => {
  try {
    const { title, image, video } = req.body;
    if (!title) return res.status(400).json({ error: 'Заголовок обязателен' });
    if (!image && !video) return res.status(400).json({ error: 'Нужно добавить изображение или видео' });

    const banner = new Banner({ title, image, video });
    await banner.save();
    res.json(banner);
  } catch (error) {
    console.error('Ошибка добавления баннера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/banners/:id', auth, admin, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Баннер удален' });
  } catch (error) {
    console.error('Ошибка удаления баннера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Фото
const photosRouter = require('./routes/photos');
app.use('/api/photos', photosRouter);

// Промокоды
app.get('/api/promos', auth, admin, async (req, res) => {
  try {
    const promos = await PromoCode.find();
    res.json(promos);
  } catch (error) {
    console.error('Ошибка получения промокодов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/promos', auth, admin, async (req, res) => {
  try {
    const { code, discount, minOrder, usageLimit } = req.body;
    const promo = new PromoCode({ code, discount, minOrder, usageLimit });
    await promo.save();
    res.json(promo);
  } catch (error) {
    console.error('Ошибка добавления промокода:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/promos/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const promo = await PromoCode.findOne({ code });
    if (!promo || promo.used >= promo.usageLimit) {
      return res.status(400).json({ error: 'Промокод недействителен' });
    }
    res.json({ discount: promo.discount, minOrder: promo.minOrder });
  } catch (error) {
    console.error('Ошибка проверки промокода:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/promos/:id', auth, admin, async (req, res) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ message: 'Промокод удалён' });
  } catch (error) {
    console.error('Ошибка удаления промокода:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отзывы
app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name');
    res.json(reviews);
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/reviews', auth, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const review = new Review({
      product: productId,
      user: req.user.id,
      rating,
      comment
    });
    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Ошибка добавления отзыва:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Статистика
app.post('/api/visits', async (req, res) => {
  try {
    const { userId, ip } = req.body;
    await Visit.create({ date: new Date(), userId, ip });
    res.json({ message: 'Визит записан' });
  } catch (error) {
    console.error('Ошибка записи визита:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/stats', auth, admin, async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(req.query.endDate || Date.now());
    const visits = await Visit.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } }
    ]);
    const uniqueUsers = await Visit.distinct('ip', { date: { $gte: startDate, $lte: endDate } });

    // Заказы за период
    const orders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } });
    const ordersCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const avgCheck = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;
    const conversion = uniqueUsers.length > 0 ? ((ordersCount / uniqueUsers.length) * 100).toFixed(1) : '0.0';

    res.json({
      visits,
      uniqueUsers: uniqueUsers.length,
      ordersCount,
      totalRevenue,
      avgCheck,
      conversion
    });
  } catch (error) {
    console.error('Ошибка статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/stats/export', auth, admin, async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(req.query.endDate || Date.now());
    const visits = await Visit.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } }
    ]);
    const uniqueUsers = await Visit.distinct('ip', { date: { $gte: startDate, $lte: endDate } });
    const orders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } });
    const ordersCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const avgCheck = ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;
    const conversion = uniqueUsers.length > 0 ? ((ordersCount / uniqueUsers.length) * 100).toFixed(1) : '0.0';

    let csv = 'Дата,Визиты,Уникальные пользователи,Заказы,Выручка,Средний чек,Конверсия (%)\n';
    const visitsMap = Object.fromEntries(visits.map(v => [v._id, v.count]));
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    days.forEach(day => {
      const dateStr = day.toISOString().slice(0, 10);
      const dayVisits = visitsMap[dateStr] || 0;
      // Для простоты: уникальные, заказы, выручка и т.д. — общие за период, не по дням
      csv += `${dateStr},${dayVisits},${uniqueUsers.length},${ordersCount},${totalRevenue},${avgCheck},${conversion}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stats.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Ошибка экспорта статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Тест Telegram
app.get('/api/test-telegram', async (req, res) => {
  try {
    if (bot) {
      await bot.telegram.sendMessage(process.env.ADMIN_TELEGRAM_ID, 'Тестовое сообщение от SanRottan');
      res.json({ status: 'Сообщение отправлено' });
    } else {
      res.status(500).json({ error: 'Telegram бот не инициализирован' });
    }
  } catch (err) {
    console.error('Ошибка теста Telegram:', err);
    res.status(500).json({ error: err.message });
  }
});

// Категории (уникальные из Product)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const result = categories.filter(Boolean).map((name, i) => ({ _id: i, name }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

app.use('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /admin\nDisallow: /api\n');
});

// ВРЕМЕННО!
app.post('/api/create-admin', async (req, res) => {
  const { email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    email,
    password: hashedPassword,
    name: 'Admin',
    surname: 'Adminov',
    role: role || 'admin'
  });
  await user.save();
  res.json({ message: 'Админ создан' });
});

// --- Управление пользователями (админ) ---
app.get('/api/admin/users', auth, admin, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) query.email = new RegExp(search, 'i');
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/admin/users/:id', auth, admin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Недопустимая роль' });
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ message: 'Роль обновлена' });
  } catch (error) {
    console.error('Ошибка смены роли:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/users/:id', auth, admin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- Аналитика: приём пользовательских событий ---
// const analyticsRateLimit = {};
app.post('/api/analytics/event', async (req, res) => {
  try {
    const { userId, type, page, timestamp, referrer, userAgent, ...details } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const key = `${ip}_${type}_${page}`;
    const now = Date.now();
    // if (analyticsRateLimit[key] && now - analyticsRateLimit[key] < 200) { // Удален глобальный rateLimit
    //   return res.status(429).json({ error: 'Too many events' });
    // }
    // analyticsRateLimit[key] = now; // Удален глобальный rateLimit
    await AnalyticsEvent.create({ userId, ip, type, page, timestamp: timestamp ? new Date(timestamp) : new Date(), referrer, userAgent, details });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка аналитики' });
  }
});

// --- Аналитика: эндпоинты для админки ---
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });
  next();
};

app.get('/api/admin/analytics/visits', auth, isAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30*24*60*60*1000);
  const end = endDate ? new Date(endDate) : new Date();
  const visits = await AnalyticsEvent.aggregate([
    { $match: { type: 'visit', timestamp: { $gte: start, $lte: end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 }, users: { $addToSet: '$userId' } } },
    { $sort: { _id: 1 } }
  ]);
  const result = visits.map(v => ({ date: v._id, visits: v.count, uniqueUsers: v.users.filter(Boolean).length }));
  res.json(result);
});

app.get('/api/admin/analytics/referrers', auth, isAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30*24*60*60*1000);
  const end = endDate ? new Date(endDate) : new Date();
  const referrers = await AnalyticsEvent.aggregate([
    { $match: { type: 'visit', timestamp: { $gte: start, $lte: end } } },
    { $group: { _id: '$referrer', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  res.json(referrers);
});

app.get('/api/admin/analytics/pages', auth, isAdmin, async (req, res) => {
  const pages = await AnalyticsEvent.distinct('page');
  res.json(pages);
});

app.get('/api/admin/analytics/clicks', auth, isAdmin, async (req, res) => {
  const { page, startDate, endDate } = req.query;
  const match = { type: 'click' };
  if (page) match.page = page;
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = new Date(startDate);
    if (endDate) match.timestamp.$lte = new Date(endDate);
  }
  const clicks = await AnalyticsEvent.find(match, { x: 1, y: 1, page: 1, timestamp: 1, details: 1 }).limit(10000);
  res.json(clicks);
});

app.get('/api/admin/analytics/events', auth, isAdmin, async (req, res) => {
  const { page = 1, limit = 100, type, search } = req.query;
  const skip = (Number(page)-1)*Number(limit);
  const query = {};
  if (type) query.type = type;
  if (search) query.$or = [
    { page: { $regex: search, $options: 'i' } },
    { userId: { $regex: search, $options: 'i' } },
    { referrer: { $regex: search, $options: 'i' } }
  ];
  const events = await AnalyticsEvent.find(query).sort({ timestamp: -1 }).skip(skip).limit(Number(limit));
  const total = await AnalyticsEvent.countDocuments(query);
  res.json({ events, total });
});

// Instant upload для фото/видео (админ)
app.post('/api/admin/upload-media', auth, admin, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];
    if (!allowed.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Недопустимый тип файла' });
    }
    const url = `/uploads/${encodeURIComponent(req.file.filename)}`;
    console.log('INSTANT UPLOAD:', req.file.originalname, '->', req.file.filename, req.file.size, 'байт');
    res.json({ url });
  } catch (error) {
    console.error('Ошибка instant upload:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 1. Добавить фото/видео к товару (instant upload, как /api/admin/upload-media, но с привязкой к товару)
app.post('/api/admin/products/:id/media', auth, admin, upload.single('media'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];
    if (!allowed.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Недопустимый тип файла' });
    }
    const url = `/uploads/${encodeURIComponent(req.file.filename)}`;
    // Определяем тип (image/video)
    if (ext.match(/\.(mp4|webm|mov)$/)) {
      product.videos = product.videos || [];
      product.videos.push(url);
    } else {
      product.images = product.images || [];
      product.images.push(url);
    }
    await product.save();
    res.json({ url });
  } catch (error) {
    console.error('Ошибка добавления медиа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 2. Удалить фото/видео из товара (и с диска)
app.delete('/api/admin/products/:id/media', auth, admin, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Не указан url' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    let changed = false;
    if (product.images && product.images.includes(url)) {
      product.images = product.images.filter(u => u !== url);
      changed = true;
    }
    if (product.videos && product.videos.includes(url)) {
      product.videos = product.videos.filter(u => u !== url);
      changed = true;
    }
    if (!changed) return res.status(404).json({ error: 'Медиа не найдено у товара' });
    // Удаляем файл с диска
    const filename = decodeURIComponent(url.split('/').pop());
    const filePath = path.join(__dirname, 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Файл удален:', filePath);
    } else {
      console.warn('Файл для удаления не найден:', filePath);
    }
    await product.save();
    res.json({ message: 'Медиа удалено' });
  } catch (error) {
    console.error('Ошибка удаления медиа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 3. Обновить порядок медиа (drag&drop)
app.put('/api/admin/products/:id/media-order', auth, admin, async (req, res) => {
  try {
    const { images, videos } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    if (images && Array.isArray(images)) product.images = images;
    if (videos && Array.isArray(videos)) product.videos = videos;
    await product.save();
    res.json({ message: 'Порядок медиа обновлён', images: product.images, videos: product.videos });
  } catch (error) {
    console.error('Ошибка обновления порядка медиа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
}

module.exports = app;
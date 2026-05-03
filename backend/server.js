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

// SECURITY: запрещаем стартовать со скомпрометированным или дефолтным секретом.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'qweasdzxc' || process.env.JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('FATAL: JWT_SECRET не задан, слишком короткий, или совпадает со скомпрометированным значением.');
    process.exit(1);
  }
}

// Экранирование пользовательского ввода перед использованием в RegExp / Mongo $regex.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Дамми-хеш фиксированной длины — чтобы login отрабатывал bcrypt и при отсутствующем юзере (постоянное время).
const DUMMY_BCRYPT_HASH = bcrypt.hashSync('not-a-real-password-but-needs-to-be-non-empty', 10);

const app = express();
app.set('trust proxy', 1);
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '256kb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", allowedOrigin],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", allowedOrigin]
    }
  }
}));

// Глобальный мягкий лимит, чтобы массовые сканеры не клали Mongo.
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));

// Жёсткий лимит на эндпоинты регистрации/логина/промокодов — против брутфорса и enumeration.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Слишком много попыток, попробуйте позже' }
});
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

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
  // unique+sparse: один и тот же телефон нельзя зарегистрировать дважды,
  // но пустые/отсутствующие телефоны не блокируют регистрацию.
  phone: { type: String, unique: true, sparse: true },
  whatsapp: Boolean,
  address: String,
  city: String,
  deliveryMethod: String,
  role: { type: String, default: 'user', enum: ['user', 'admin'] }
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
    quantity: Number,
    selectedOptions: [{ name: String, price: Number }]
  }],
  totalPrice: Number,
  promoCode: String,
  discount: Number,
  status: { type: String, default: 'pending', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
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
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now }
});
// Один отзыв на пару (товар, пользователь) — защита от спама.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
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

// Middleware: декодирует JWT, если он есть и валиден; не блокирует анонимный доступ
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {}
  next();
};

// Регистрация
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name, surname, phone, whatsapp, address, city, deliveryMethod } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Пароль должен быть не короче 8 символов' });
    }
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;
    try {
      user = new User({ email, password: hashedPassword, name, surname, phone, whatsapp, address, city, deliveryMethod, role: 'user' });
      await user.save();
    } catch (e) {
      // Дублирование уникального индекса (email/phone) — единый ответ.
      if (e && e.code === 11000) return res.status(400).json({ error: 'Email или телефон уже зарегистрирован' });
      throw e;
    }
    // SECURITY: НЕ переносим гостевые заказы по совпадающему телефону при регистрации
    // (был account-takeover вектор: знаешь телефон жертвы → видишь её заказы).
    // Теперь линковка только через явный POST /api/orders/claim-guest-orders с проверкой владения.
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '14d' });
    res.json({ token, role: user.role });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Логин
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // Equalize timing: всегда дёргаем bcrypt.compare, даже если юзера нет —
    // иначе разница времени между «нет email» и «неверный пароль» становится оракулом enumeration.
    const passwordHash = user?.password || DUMMY_BCRYPT_HASH;
    const passOk = await bcrypt.compare(password || '', passwordHash);
    if (!user || !user.password || !passOk) {
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
    if (search) query.name = new RegExp(escapeRegex(search), 'i');
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Некорректный id' });
    // SECURITY: whitelist полей. Раньше брали весь req.body → mass-assignment
    // (можно было перезаписать productId, __v и т.п.).
    const allowed = ['name', 'description', 'price', 'category', 'color', 'options', 'characteristics', 'stock'];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
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
app.post('/api/orders', writeLimiter, optionalAuth, async (req, res) => {
  // Локальный «компенсирующий журнал» для отката stock/promo если что-то упадёт после части изменений
  // (mongoose-транзакций нет — кластер однонодовый, так что best-effort).
  const decremented = [];
  let promoIncremented = null;
  try {
    const { guestData, products, promoCode } = req.body;
    const userId = req.user?.id || null;

    // 1. Валидация payload — против отрицательных/огромных количеств и кривых id.
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Заказ пустой' });
    }
    for (const item of products) {
      if (!item || !item.product || !mongoose.Types.ObjectId.isValid(item.product)
          || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000) {
        return res.status(400).json({ error: 'Некорректная позиция в заказе' });
      }
    }

    // 2. Подгружаем товары + считаем total ДО применения промо (нужно для minOrder).
    // SECURITY: цены опций берём ТОЛЬКО с сервера, body.price игнорируем (revenue-leak fix).
    const populatedProducts = [];
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ error: 'Товар не найден' });

      // Валидируем выбранные опции против продукта: каждая должна существовать и быть enabled.
      const selectedOptions = [];
      const requested = Array.isArray(item.selectedOptions) ? item.selectedOptions : [];
      const seen = new Set();
      for (const sel of requested) {
        if (!sel || typeof sel.name !== 'string') continue;
        if (seen.has(sel.name)) continue; // дедуп — нельзя дважды добавить одну опцию
        const match = (product.options || []).find(o => o.enabled && o.name === sel.name);
        if (!match) {
          return res.status(400).json({ error: `Опция "${sel.name}" недоступна для товара "${product.name}"` });
        }
        seen.add(sel.name);
        selectedOptions.push({ name: match.name, price: Number(match.price) || 0 });
      }
      const optionsTotal = selectedOptions.reduce((s, o) => s + o.price, 0);
      populatedProducts.push({ product, quantity: item.quantity, selectedOptions, optionsTotal });
    }
    const subtotal = populatedProducts.reduce(
      (sum, x) => sum + ((x.product.price || 0) + x.optionsTotal) * x.quantity, 0
    );

    // 3. Атомарный инкремент промо: только если used < usageLimit и subtotal >= minOrder.
    let discount = 0;
    if (promoCode) {
      const promo = await PromoCode.findOneAndUpdate(
        {
          code: promoCode,
          $expr: { $lt: ['$used', '$usageLimit'] },
          $or: [{ minOrder: { $exists: false } }, { minOrder: { $lte: subtotal } }]
        },
        { $inc: { used: 1 } },
        { new: true }
      );
      if (promo) {
        discount = promo.discount || 0;
        promoIncremented = promo.code;
      }
      // Иначе — молча игнорируем промокод (как раньше); фронт получит финальную цену в ответе.
    }
    const totalPrice = subtotal * (1 - discount / 100);

    // 4. Атомарный декремент стока для каждой позиции с откатом при провале.
    for (const item of populatedProducts) {
      if (typeof item.product.stock !== 'number') continue;
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        // Rollback всё уже декрементированное и инкрементированный промо.
        for (const d of decremented) {
          await Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } });
        }
        if (promoIncremented) {
          await PromoCode.findOneAndUpdate({ code: promoIncremented }, { $inc: { used: -1 } });
        }
        return res.status(409).json({ error: `Недостаточно товара "${item.product.name}" на складе` });
      }
      decremented.push({ id: item.product._id, qty: item.quantity });
    }

    // 5. Номер заказа — атомарный счётчик.
    const counter = await OrderCounter.findOneAndUpdate(
      { key: 'orderNumber' }, { $inc: { value: 1 } }, { new: true, upsert: true }
    );
    const orderNumber = counter.value;

    const order = new Order({
      orderNumber,
      userId,
      guestData,
      products: populatedProducts.map(p => ({ product: p.product._id, quantity: p.quantity, selectedOptions: p.selectedOptions })),
      totalPrice,
      promoCode: promoIncremented || '',
      discount
    });
    await order.save();
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
    // Best-effort rollback на любой ошибке после декремента стока / инкремента промо.
    for (const d of decremented) {
      try { await Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } }); } catch {}
    }
    if (promoIncremented) {
      try { await PromoCode.findOneAndUpdate({ code: promoIncremented }, { $inc: { used: -1 } }); } catch {}
    }
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

// Привязка guest-заказов к userId — только по СОБСТВЕННОМУ телефону/email юзера.
app.post('/api/orders/claim-guest-orders', auth, async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone && !email) return res.status(400).json({ error: 'Не указан телефон или email' });
    const me = await User.findById(req.user.id).select('email phone');
    if (!me) return res.status(404).json({ error: 'Пользователь не найден' });
    // SECURITY: разрешаем линковать только те guest-заказы, где phone/email
    // совпадают с теми, что записаны в профиле текущего юзера.
    // Раньше здесь принимались любые phone/email из тела → IDOR на чужие заказы.
    if (phone && phone !== me.phone) {
      return res.status(403).json({ error: 'Этот телефон не привязан к вашему аккаунту' });
    }
    if (email && email !== me.email) {
      return res.status(403).json({ error: 'Этот email не привязан к вашему аккаунту' });
    }
    let updated = 0;
    if (phone) {
      const r = await Order.updateMany({ 'guestData.phone': phone, userId: null }, { $set: { userId: req.user.id } });
      updated += r.modifiedCount || r.nModified || 0;
    }
    if (email) {
      const r = await Order.updateMany({ 'guestData.email': email, userId: null }, { $set: { userId: req.user.id } });
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

app.post('/api/promos/validate', writeLimiter, async (req, res) => {
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

// Статистика — приём визита.
// SECURITY: ip всегда из соединения, userId — только из проверенного JWT.
// Раньше принимали то и другое из тела → можно было фабриковать визиты от чужого имени.
app.post('/api/visits', writeLimiter, optionalAuth, async (req, res) => {
  try {
    const ip = req.ip;
    const userId = req.user?.id || null;
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

// Тест Telegram — теперь только под админом, чтобы нельзя было спамить владельца извне.
app.get('/api/test-telegram', auth, admin, async (req, res) => {
  try {
    if (!bot) return res.status(503).json({ error: 'Telegram бот не инициализирован' });
    await bot.telegram.sendMessage(process.env.ADMIN_TELEGRAM_ID, 'Тестовое сообщение от SanRottan');
    res.json({ status: 'Сообщение отправлено' });
  } catch (err) {
    console.error('Ошибка теста Telegram:', err);
    res.status(500).json({ error: 'Ошибка отправки' });
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

// /api/create-admin удалён (был открытым эндпоинтом создания админа). Сидинг — только локально.

// --- Управление пользователями (админ) ---
app.get('/api/admin/users', auth, admin, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) query.email = new RegExp(escapeRegex(search), 'i');
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
const ALLOWED_EVENT_TYPES = new Set(['visit', 'click', 'scroll', 'pageview', 'addtocart', 'purchase', 'search']);
app.post('/api/analytics/event', writeLimiter, optionalAuth, async (req, res) => {
  try {
    const { type, page, timestamp, referrer, userAgent, ...details } = req.body;
    if (!ALLOWED_EVENT_TYPES.has(type)) return res.status(400).json({ error: 'Неизвестный тип события' });
    if (typeof page !== 'string' || page.length > 1024) return res.status(400).json({ error: 'page обязателен' });
    // SECURITY: ограничиваем размер details (раньше принимали что угодно — DOS-фарш для Mongo).
    if (JSON.stringify(details).length > 4096) return res.status(413).json({ error: 'details слишком большой' });
    const ip = req.ip;
    const userId = req.user?.id || null; // больше не верим userId из тела
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
    { page:     { $regex: escapeRegex(search), $options: 'i' } },
    { userId:   { $regex: escapeRegex(search), $options: 'i' } },
    { referrer: { $regex: escapeRegex(search), $options: 'i' } }
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
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const isSafeMediaUrl = (u) => typeof u === 'string' && /^\/uploads\/[A-Za-z0-9._\-]+$/.test(u);

app.delete('/api/admin/products/:id/media', auth, admin, async (req, res) => {
  try {
    const { url } = req.query;
    // SECURITY: принимаем только канонический /uploads/<basename>, никаких слешей/двоеточий внутри.
    if (!isSafeMediaUrl(url)) return res.status(400).json({ error: 'Некорректный url' });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Некорректный id' });
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
    // Удаляем файл с диска. Защита: путь должен оставаться внутри UPLOADS_DIR.
    const filename = path.basename(url);
    const filePath = path.resolve(UPLOADS_DIR, filename);
    if (filePath.startsWith(UPLOADS_DIR + path.sep) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await product.save();
    res.json({ message: 'Медиа удалено' });
  } catch (error) {
    console.error('Ошибка удаления медиа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 3. Обновить порядок медиа (drag&drop) — принимаем только URL'ы из /uploads.
app.put('/api/admin/products/:id/media-order', auth, admin, async (req, res) => {
  try {
    const { images, videos } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Некорректный id' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    if (images !== undefined) {
      if (!Array.isArray(images) || !images.every(isSafeMediaUrl)) return res.status(400).json({ error: 'images: ожидается массив /uploads/имя_файла' });
      product.images = images;
    }
    if (videos !== undefined) {
      if (!Array.isArray(videos) || !videos.every(isSafeMediaUrl)) return res.status(400).json({ error: 'videos: ожидается массив /uploads/имя_файла' });
      product.videos = videos;
    }
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
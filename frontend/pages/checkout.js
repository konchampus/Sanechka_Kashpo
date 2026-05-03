import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from '../lib/axios';
import { showToast } from './_app';
import FAQ from '../components/FAQ';
import { motion } from 'framer-motion';
import { FaUser, FaPhone, FaCity, FaMapMarkerAlt, FaTruck, FaPercent, FaEnvelope } from 'react-icons/fa';
import styles from '../styles/Checkout.module.css';
import Head from 'next/head';
import { calculateCartTotals } from '../lib/utils';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    email: '',
    whatsapp: false,
    address: '',
    city: '',
    deliveryMethod: 'Cdek'
  });
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isAuth, setIsAuth] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(storedCart);
    // Читаем промокод и скидку из localStorage
    const promo = JSON.parse(localStorage.getItem('promo') || '{}');
    if (promo && promo.discount) setDiscount(promo.discount);
    if (promo && promo.code) setPromoCode(promo.code);
    if (localStorage.getItem('token')) {
      setIsAuth(true);
      axios.get('/api/auth/me').then(res => setFormData(prev => ({ ...prev, ...res.data })));
    }
  }, []);

  // --- Итоговая цена с учётом доп. услуг ---
  const { items, total, discount: disc, discountAmount, finalTotal } = calculateCartTotals(cart, discount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Введите имя';
    if (!formData.surname) newErrors.surname = 'Введите фамилию';
    if (!formData.phone) newErrors.phone = 'Введите телефон';
    if (!isAuth && !formData.email) newErrors.email = 'Введите email';
    if (!formData.city) newErrors.city = 'Введите город';
    if (!formData.address) newErrors.address = 'Введите адрес';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    try {
      // userId берётся сервером из JWT (см. POST /api/orders, optionalAuth) — клиентский id не доверяемый.
      // selectedOptions: отправляем выбранные опции — сервер сам валидирует названия и берёт цены из БД.
      // promoCode: всегда шлём код, чтобы серверный атомарный $inc used учёл лимит usageLimit.
      const res = await axios.post('/api/orders', {
        guestData: formData,
        products: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          selectedOptions: Array.isArray(item.selectedOptions)
            ? item.selectedOptions
                .map(o => (typeof o === 'string' ? { name: o } : (o && typeof o.name === 'string' ? { name: o.name } : null)))
                .filter(Boolean)
            : []
        })),
        promoCode: promoCode || ''
      });
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('authChange'));
      router.push(`/success?orderNumber=${res.data.orderNumber}`);
    } catch (error) {
      showToast('error', 'Ошибка оформления заказа');
    }
  };

  return (
    <div className={styles.checkoutPageWrap}>
      <Head>
        <title>Оформление заказа — ротанг, мебель, декор | SanRottan</title>
        <meta name="description" content="Оформление заказа в магазине SanRottan. Мебель, декор, кашпо из ротанга. Быстрая доставка по России, гарантия качества." />
        <meta name="keywords" content="оформление заказа, ротанг, купить ротанг, мебель из ротанга, декор, SanRottan, интернет-магазин" />
        <meta property="og:title" content="Оформление заказа — ротанг, мебель, декор | SanRottan" />
        <meta property="og:description" content="Оформление заказа в магазине SanRottan. Мебель, декор, кашпо из ротанга. Быстрая доставка по России, гарантия качества." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
      </Head>
      <h1 className={styles.checkoutTitle}>Оформление заказа</h1>
      <div className={styles.progressBar}><div className={styles.progressStep} /></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', margin: '40px 0' }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 28, minWidth: 280, maxWidth: 400, flex: '1 1 320px' }}>
          <h3 style={{ color: 'var(--accent-brown)', fontFamily: 'Sinoreta, serif', fontSize: '1.3rem', marginBottom: 12 }}>Доставка</h3>
          <ul style={{ textAlign: 'left', color: 'var(--primary-text)', fontSize: '1.05rem', marginBottom: 0, paddingLeft: 0, listStyle: 'none' }}>
            <li style={{ marginBottom: 12 }}><b>Самовывоз</b><br />Вы можете забрать свой заказ в нашей мастерской, пос. Светлый 10.00 до 20.00 по предварительной договоренности</li>
            <li style={{ marginBottom: 12 }}><b>Доставка по Магнитогорску</b><br />Доставка курьером в любую точку города: бесплатная от 3000₽</li>
            <li><b>Доставка по России</b><br />Доставку заказов по всей территории РФ с помощью СДЭК, Почта России.</li>
          </ul>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 28, minWidth: 280, maxWidth: 400, flex: '1 1 320px' }}>
          <h3 style={{ color: 'var(--accent-brown)', fontFamily: 'Sinoreta, serif', fontSize: '1.3rem', marginBottom: 12 }}>Покупайте с комфортом</h3>
          <ul style={{ textAlign: 'left', color: 'var(--primary-text)', fontSize: '1.05rem', marginBottom: 0, paddingLeft: 0, listStyle: 'none' }}>
            <li style={{ marginBottom: 12 }}><b>Оплата наличными</b><br />Оплачивайте товар наличными курьеру при получении заказа или в мастерской</li>
            <li style={{ marginBottom: 12 }}><b>Безналичный расчет</b><br />При помощи расчетного счета организации</li>
            <li><b>Банковской картой</b><br />Оплачивайте товар картой онлайн</li>
          </ul>
        </div>
      </div>
      <form className={styles.checkoutForm} onSubmit={handleSubmit} autoComplete="off">
        <div className={styles.sectionTitle}>Контактные данные</div>
        <div className={styles.inputRow}>
          <input type="text" className={`${styles.input} ${errors.name ? 'error' : ''}`} placeholder="Имя" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          {errors.name && <div style={{ color: '#d9534f', fontSize: 13, marginTop: 2 }}>{errors.name}</div>}
          <input type="text" className={`${styles.input} ${errors.surname ? 'error' : ''}`} placeholder="Фамилия" value={formData.surname} onChange={e => setFormData({ ...formData, surname: e.target.value })} required />
          {errors.surname && <div style={{ color: '#d9534f', fontSize: 13, marginTop: 2 }}>{errors.surname}</div>}
        </div>
        <div className={styles.inputRow}>
          <input type="text" className={`${styles.input} ${errors.phone ? 'error' : ''}`} placeholder="Телефон" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
          {errors.phone && <div style={{ color: '#d9534f', fontSize: 13, marginTop: 2 }}>{errors.phone}</div>}
          {!isAuth && (
            <input type="email" className={`${styles.input} ${errors.email ? 'error' : ''}`} placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          )}
          {errors.email && <div style={{ color: '#d9534f', fontSize: 13, marginTop: 2 }}>{errors.email}</div>}
        </div>
        <div className={styles.inputRow} style={{ alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: '#4A7043', cursor: 'pointer' }}>
            <input type="checkbox" className={styles.inputCheckbox} checked={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.checked })} style={{ marginRight: 6 }} />
            Имеется ли Telegram? 
          </label>
        </div>
        <div className={styles.sectionTitle}>Адрес доставки</div>
        <div className={styles.inputRow}>
          <input type="text" className={`${styles.input} ${errors.city ? 'error' : ''}`} placeholder="Город" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required />
          {errors.city && <div style={{ color: '#d9534f', fontSize: 13, marginTop: 2 }}>{errors.city}</div>}
          <input type="text" className={`${styles.input} ${errors.address ? 'error' : ''}`} placeholder="Адрес" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
          {errors.address && <div style={{ color: '#d9534f', fontSize: 13, marginTop: 2 }}>{errors.address}</div>}
        </div>
        <div className={styles.inputRow}>
          <select className={styles.input} value={formData.deliveryMethod} onChange={e => setFormData({ ...formData, deliveryMethod: e.target.value })} required>
            <option value="Cdek">CDEK</option>
            <option value="Почта России">Почта России</option>
            <option value="Самовывоз">Самовывоз</option>
          </select>
        </div>
        {/* Промокод только отображается, если есть */}
        {promoCode && !discount && (
          <div style={{ color: '#d9534f', fontSize: 15, marginBottom: 8 }}>
            Промокод <b>{promoCode}</b> не применён — скидка не найдена. Введите промокод заново в корзине.
          </div>
        )}
        {promoCode && (
          <div className={styles.sectionTitle}>
            Промокод: <b>{promoCode}</b> (скидка {discount}%)
          </div>
        )}
        <div className={styles.totalBlock}>
          <div className={styles.totalValue}>Итого: {finalTotal} руб.</div>
        </div>
        <button type="submit" className={styles.checkoutBtn}>Оформить заказ</button>
      </form>
      <div style={{ marginTop: 40 }}>
        <FAQ />
      </div>
    </div>
  );
}
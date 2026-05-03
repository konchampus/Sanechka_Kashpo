import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTruck, FaHistory, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import axios from '../lib/axios';
import { showSuccess, showError } from '../lib/notifications';
import styles from '../styles/Account.module.css';
import Head from 'next/head';
import Link from 'next/link';
import { getImageUrl } from '../lib/utils';
import Cookies from 'js-cookie';

export default function Account() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const fetchData = async () => {
      try {
        const [userRes, ordersRes] = await Promise.all([
          axios.get('/api/auth/me'),
          axios.get('/api/orders')
        ]);
        setUser(userRes.data);
        setOrders(ordersRes.data);
        setFormData(userRes.data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Ошибка загрузки профиля');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/auth/me', formData);
      setUser(formData);
      setIsEditing(false);
      showSuccess('Профиль обновлен');
    } catch (error) {
      showError('Ошибка обновления профиля');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    Cookies.remove('token');
    Cookies.remove('role');
    window.dispatchEvent(new Event('authChange'));
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className={styles.accountPageWrap}>
        <div className={styles.loading}>Загрузка профиля...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.accountPageWrap}>
        <div className={styles.errorMessage}>
          <p>Не удалось загрузить профиль</p>
          <Link href="/login" className={styles.loginLink}>Войти в аккаунт</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.accountPageWrap}>
      <Head>
        <title>Личный кабинет | SanRottan</title>
        <meta name="description" content="Личный кабинет пользователя SanRottan" />
      </Head>

      <div className={styles.accountContainer}>
        <motion.div 
          className={styles.accountHeader}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.accountTitle}>
            <FaUser /> Личный кабинет
          </h1>
          <p>Добро пожаловать, {user.name || 'Пользователь'}!</p>
        </motion.div>

        <div className={styles.accountGrid}>
          {/* Профиль */}
          <motion.div 
            className={styles.profileBlock}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className={styles.profileHeader}>
              <h2>
                <FaUser /> Профиль
              </h2>
              {!isEditing ? (
                <button 
                  className={styles.editBtn}
                  onClick={() => setIsEditing(true)}
                >
                  <FaEdit /> Редактировать
                </button>
              ) : (
                <div className={styles.editActions}>
                  <button 
                    className={styles.saveBtn}
                    onClick={handleUpdate}
                  >
                    <FaSave /> Сохранить
                  </button>
                  <button 
                    className={styles.cancelBtn}
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(user);
                    }}
                  >
                    <FaTimes /> Отмена
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleUpdate} className={styles.accountForm}>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.accountLabel}>
                    <FaUser /> Имя
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={styles.accountInput}
                    disabled={!isEditing}
                    placeholder="Ваше имя"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.accountLabel}>
                    <FaUser /> Фамилия
                  </label>
                  <input
                    type="text"
                    value={formData.surname || ''}
                    onChange={(e) => setFormData({...formData, surname: e.target.value})}
                    className={styles.accountInput}
                    disabled={!isEditing}
                    placeholder="Ваша фамилия"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.accountLabel}>
                    <FaEnvelope /> Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    className={styles.accountInput}
                    disabled={true}
                    placeholder="email@example.com"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.accountLabel}>
                    <FaPhone /> Телефон
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={styles.accountInput}
                    disabled={!isEditing}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.accountLabel}>
                    <FaMapMarkerAlt /> Город
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className={styles.accountInput}
                    disabled={!isEditing}
                    placeholder="Ваш город"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.accountLabel}>
                    <FaMapMarkerAlt /> Адрес
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className={styles.accountInput}
                    disabled={!isEditing}
                    placeholder="Ваш адрес"
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.accountLabel}>
                  <FaTruck /> Способ доставки
                </label>
                <select
                  value={formData.deliveryMethod || ''}
                  onChange={(e) => setFormData({...formData, deliveryMethod: e.target.value})}
                  className={styles.accountInput}
                  disabled={!isEditing}
                >
                  <option value="">Выберите способ доставки</option>
                  <option value="СДЭК">СДЭК</option>
                  <option value="Почта России">Почта России</option>
                  <option value="Самовывоз">Самовывоз</option>
                </select>
              </div>

              <div className={styles.checkboxField}>
                <label className={styles.accountCheck}>
                  <input
                    type="checkbox"
                    checked={formData.whatsapp || false}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.checked})}
                    disabled={!isEditing}
                  />
                  <span>Получать уведомления в Telegram</span>
                </label>
              </div>
            </form>

            <button onClick={handleLogout} className={styles.logoutBtn}>
              Выйти из аккаунта
            </button>
          </motion.div>

          {/* Заказы */}
          <motion.div 
            className={styles.ordersBlock}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.ordersHeader}>
              <h2>
                <FaHistory /> Мои заказы
              </h2>
              <span className={styles.ordersCount}>{orders.length} заказ{orders.length === 1 ? '' : orders.length < 5 ? 'а' : 'ов'}</span>
            </div>

            {orders.length === 0 ? (
              <div className={styles.noOrders}>
                <p>У вас пока нет заказов</p>
                <Link href="/shop" className={styles.shopLink}>
                  Перейти в магазин
                </Link>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map((order) => (
                  <div key={order._id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <h3>Заказ №{order.orderNumber}</h3>
                      <span className={`${styles.status} ${styles[`status_${order.status}`]}`}>
                        {order.status === 'pending' && 'Ожидает обработки'}
                        {order.status === 'processing' && 'В обработке'}
                        {order.status === 'shipped' && 'Отправлен'}
                        {order.status === 'delivered' && 'Доставлен'}
                        {order.status === 'cancelled' && 'Отменён'}
                      </span>
                    </div>
                    
                    <div className={styles.orderProducts}>
                      {order.products.map((item, index) => (
                        <div key={index} className={styles.orderProduct}>
                          {item.product?.images?.[0] && item.product.images[0].includes('.mp4') ? (
                            <video 
                              src={getImageUrl(item.product.images[0])} 
                              style={{ width: 60, height: 60, borderRadius: 8, background: '#000', objectFit: 'cover' }}
                              autoPlay muted loop playsInline
                            />
                          ) : (
                            <img 
                              src={getImageUrl(item.product?.images?.[0])} 
                              alt={item.product?.name || 'Товар'}
                              className={styles.orderProductImg}
                            />
                          )}
                          <div className={styles.orderProductInfo}>
                            <h4>{item.product?.name || 'Товар'}</h4>
                            <p>Количество: {item.quantity}</p>
                            <p>Цена: {item.product?.price || 0} ₽</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className={styles.orderFooter}>
                      <div className={styles.orderTotal}>
                        <strong>Итого: {order.totalPrice} ₽</strong>
                      </div>
                      <div className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
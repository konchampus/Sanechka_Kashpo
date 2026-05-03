import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingCart, FaTrashAlt, FaMinus, FaPlus, FaArrowLeft, FaPercent, FaGift, FaTruck, FaCreditCard, FaTimes } from 'react-icons/fa';
import { showSuccess, showError, showWarning } from '../lib/notifications';
import { getImageUrl, calculateCartTotals } from '../lib/utils';
import styles from '../styles/Cart.module.css';
import Head from 'next/head';
import Link from 'next/link';
import axios from '../lib/axios';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoValid, setPromoValid] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    // Восстанавливаем промокод и скидку
    const promo = JSON.parse(localStorage.getItem('promo') || '{}');
    if (promo && promo.code && promo.discount) {
      setPromoCode(promo.code);
      setDiscount(promo.discount);
      setPromoValid(true);
    }
  }, []);

  // Хелпер для сравнения selectedOptions
  const isSameOptions = (a, b) => JSON.stringify(a || []) === JSON.stringify(b || []);

  const updateQuantity = (id, quantity, selectedOptions) => {
    if (quantity < 1) return;
    const updatedCart = cart.map(item => 
      item._id === id && isSameOptions(item.selectedOptions, selectedOptions)
        ? { ...item, quantity }
        : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('authChange'));
  };

  const removeItem = (id, selectedOptions) => {
    const updatedCart = cart.filter(item => !(item._id === id && isSameOptions(item.selectedOptions, selectedOptions)));
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('authChange'));
    showSuccess('Товар удален из корзины');
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      showWarning('Введите промокод');
      return;
    }
    setIsApplyingPromo(true);
    try {
      const res = await axios.post('/api/promos/validate', { code: promoCode });
      if (res.data && res.data.discount) {
        setDiscount(res.data.discount);
        localStorage.setItem('promo', JSON.stringify({ code: promoCode, discount: res.data.discount }));
        setPromoValid(true);
        showSuccess(`Промокод применен! Скидка: ${res.data.discount}%`);
      } else {
        setDiscount(0);
        setPromoValid(false);
        localStorage.removeItem('promo');
        showError(res.data?.error || 'Неверный промокод');
      }
    } catch (error) {
      setDiscount(0);
      setPromoValid(false);
      localStorage.removeItem('promo');
      showError('Ошибка применения промокода');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const resetPromo = () => {
    setPromoCode('');
    setDiscount(0);
    setPromoValid(false);
    localStorage.removeItem('promo');
  };

  // Изменение выбранных опций для товара
  const handleOptionToggle = (itemId, optionName) => {
    setCart(prevCart => {
      const updated = prevCart.map(item => {
        if (item._id !== itemId) return item;
        let selected = Array.isArray(item.selectedOptions) ? [...item.selectedOptions] : [];
        if (selected.includes(optionName)) {
          selected = selected.filter(o => o !== optionName);
        } else {
          selected.push(optionName);
        }
        return { ...item, selectedOptions: selected };
      });
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const { items, total, discount: disc, discountAmount, finalTotal } = calculateCartTotals(cart, discount);

  if (cart.length === 0) {
    return (
      <div className={styles.cartPageWrap}>
        <Head>
          <title>Корзина | SanRottan</title>
          <meta name="description" content="Ваша корзина с товарами из ротанга" />
        </Head>
        
        <motion.div 
          className={styles.emptyCart}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.emptyCartIcon}>
            <FaShoppingCart />
          </div>
          <h2>Корзина пуста</h2>
          <p>Добавьте товары из нашего каталога, чтобы сделать заказ</p>
          <Link href="/shop" className={styles.emptyCartBtn}>
            <FaArrowLeft /> Перейти в магазин
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.cartPageWrap}>
      <Head>
        <title>Корзина ({cart.length} товаров) | SanRottan</title>
        <meta name="description" content="Ваша корзина с товарами из ротанга" />
      </Head>

      <div className={styles.cartContainer}>
        <motion.div 
          className={styles.cartHeader}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.cartTitle}>
            <FaShoppingCart /> Корзина
          </h1>
          <span className={styles.cartCount}>{cart.length} товар{cart.length === 1 ? '' : cart.length < 5 ? 'а' : 'ов'}</span>
        </motion.div>

        <div className={styles.cartGrid}>
          <div className={styles.cartListCol}>
            <motion.div 
              className={styles.cartList}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {cart.map((item, index) => {
                const itemOptionsTotal = item.selectedOptions ? item.selectedOptions.reduce((sum, opt) => sum + (opt.price || 0), 0) : 0;
                const itemTotal = (item.price + itemOptionsTotal) * item.quantity;
                return (
                  <motion.div 
                    key={item._id}
                    className={styles.cartCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, boxShadow: '0 8px 32px rgba(122,92,58,0.15)' }}
                  >
                    <div className={styles.cartImg}>
                      <Link href={`/product/${item._id}`} className={styles.cartImg} style={{ cursor: 'pointer' }}>
                        <img 
                          src={getImageUrl(item.images && item.images[0])} 
                          alt={item.name}
                          onError={e => { e.target.src = '/images/placeholder.jpg'; }}
                        />
                      </Link>
                    </div>
                    <div className={styles.cartInfoBlock}>
                      <div className={styles.cartInfoTop}>
                        <div className={styles.cartName}>
                          <Link href={`/product/${item._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{item.name}</Link>
                        </div>
                        <div className={styles.cartMeta}>
                          {item.category && <span className={styles.cartCategory}>{item.category}</span>}
                          {item.color && <span className={styles.cartColor}>{item.color}</span>}
                        </div>
                      </div>
                      <div className={styles.cartInfoBottom}>
                        <div className={styles.cartPriceBlock}>
                          {/* UI для изменения опций */}
                          {item.options && item.options.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 14, color: '#7A5C3A', marginBottom: 2 }}>Доп. услуги:</div>
                              {item.options.map(opt => (
                                <label key={opt.name} style={{ display: 'block', fontSize: 14, marginBottom: 2 }}>
                                  <input
                                    type="checkbox"
                                    checked={Array.isArray(item.selectedOptions) && item.selectedOptions.includes(opt.name)}
                                    onChange={() => handleOptionToggle(item._id, opt.name)}
                                    style={{ marginRight: 6 }}
                                  />
                                  {opt.name} {opt.price > 0 ? `(+${opt.price}₽)` : ''}
                                </label>
                              ))}
                            </div>
                          )}
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <div className={styles.cartOptionsBlock}>
                              {item.selectedOptions.map(optName => {
                                const opt = item.options?.find(o => o.name === optName);
                                return opt ? (
                                  <div key={opt.name} className={styles.cartOptionRow}>
                                    <span>{opt.name}</span>
                                    {opt.price > 0 && <span>+{opt.price} ₽</span>}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}
                          {item.oldPrice && <span className={styles.cartOldPrice}>{item.oldPrice} ₽</span>}
                          <span className={styles.cartPrice}>{itemTotal} ₽</span>
                        </div>
                        <div className={styles.cartQtyBlock}>
                          <button 
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item._id, item.quantity - 1, item.selectedOptions)}
                            disabled={item.quantity <= 1}
                            aria-label="Уменьшить количество"
                          >
                            <FaMinus />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const max = typeof item.stock === 'number' ? item.stock : Infinity;
                              const v = Math.min(Math.max(parseInt(e.target.value) || 1, 1), max);
                              updateQuantity(item._id, v, item.selectedOptions);
                            }}
                            className={styles.qtyInput}
                            min="1"
                            max={typeof item.stock === 'number' ? item.stock : undefined}
                          />
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item._id, item.quantity + 1, item.selectedOptions)}
                            disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                            aria-label="Увеличить количество"
                          >
                            <FaPlus />
                          </button>
                        </div>
                        <button 
                          className={styles.removeBtn}
                          onClick={() => removeItem(item._id, item.selectedOptions)}
                          aria-label="Удалить товар"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <div className={styles.cartSummaryCol}>
            <motion.div 
              className={styles.cartSummaryBlock}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className={styles.cartSummaryTitle}>
                <FaCreditCard /> Итого заказа
              </h2>
              
              <div className={styles.cartSummaryDetails}>
                <table style={{ width: '100%', fontSize: 15, marginBottom: 8 }}>
                  <thead>
                    <tr><th style={{ textAlign: 'left' }}>Товар</th><th>Кол-во</th><th>Опции</th><th>Сумма</th></tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.options && item.options.length > 0 ? item.options.map(o => `${o.name} (+${o.price}₽)`).join(', ') : '—'}</td>
                        <td>{item.itemTotal} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.summaryRow}>
                  <span>Товары ({cart.length}):</span>
                  <span>{total} ₽</span>
                </div>
                {disc > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Скидка ({disc}%):</span>
                    <span className={styles.discountText}>-{discountAmount} ₽</span>
                  </div>
                )}
                <div className={styles.summaryRowTotal}>
                  <span>Итого к оплате:</span>
                  <span className={styles.finalTotal}>{finalTotal} ₽</span>
                </div>
              </div>

              <div className={styles.promoBlock}>
                <div className={styles.promoInputGroup}>
                  <input
                    type="text"
                    placeholder="Промокод"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className={styles.promoInput}
                    disabled={promoValid}
                  />
                  <button 
                    onClick={applyPromoCode}
                    disabled={isApplyingPromo || promoValid}
                    className={styles.promoBtn}
                    aria-label="Применить"
                    style={{ background: '#fff', boxShadow: '0 2px 8px rgba(122,92,58,0.10)', border: 'none', borderRadius: 8, padding: '0 16px', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isApplyingPromo ? '...' : <FaPercent style={{ marginRight: 4, fontSize: 22, color: '#7A5C3A' }} />}
                  </button>
                  {promoValid && (
                    <button onClick={resetPromo} className={styles.promoBtn} style={{ background: '#fff', boxShadow: '0 2px 8px rgba(217,83,79,0.13)', border: 'none', borderRadius: 8, padding: '0 16px', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Сбросить промокод">
                      <FaTimes style={{ fontSize: 22, color: '#d9534f' }} />
                    </button>
                  )}
                </div>
                {promoValid && (
                  <div style={{ color: '#4A7043', fontSize: 14, marginTop: 4 }}>Промокод применён: <b>{promoCode}</b> ({discount}%)</div>
                )}
              </div>

              <Link href="/checkout" className={styles.checkoutBtn}>
                <FaCreditCard /> Оформить заказ
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { showToast } from '../pages/_app';
import { FaShoppingCart } from 'react-icons/fa';
import { getImageUrl } from '../lib/utils';
import styles from '../styles/Shop.module.css';

export default function ProductCard({ product }) {
  const outOfStock = typeof product.stock === 'number' && product.stock <= 0;
  const addToCart = () => {
    if (outOfStock) {
      showToast('error', 'Товар закончился');
      return;
    }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      // Не превышаем фактический сток (защита от заведомо нерабочего заказа).
      const max = typeof product.stock === 'number' ? product.stock : Infinity;
      if (existingItem.quantity >= max) {
        showToast('error', `Больше ${max} шт «${product.name}» добавить нельзя`);
        return;
      }
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('authChange'));
    showToast('success', `${product.name} добавлен в корзину!`);
  };
  const imgSrc = getImageUrl(product.images && product.images[0]);
  const oldPrice = product.oldPrice;
  const discount = oldPrice ? Math.round(100 - product.price / oldPrice * 100) : 0;
  return (
    <motion.div
      className={styles.marketCard}
      whileHover={{ scale: 1.035, boxShadow: '0 8px 32px rgba(74,112,67,0.13)' }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link href={`/product/${product._id}`} passHref legacyBehavior>
        <a aria-label={`Открыть страницу товара ${product.name}`} className={styles.marketCardLink}>
          <div className={styles.marketCardImgWrap}>
            <img
              src={imgSrc}
              alt={product.name}
              className={styles.marketCardImg + ' unifiedImage'}
              loading="lazy"
              onError={e => { e.target.src = '/images/placeholder.jpg'; }}
            />
            {discount > 0 && (
              <span className={styles.marketCardDiscount}>-{discount}%</span>
            )}
          </div>
          <div className={styles.marketCardInfo}>
            <div className={styles.marketCardTitle}>{product.name}</div>
            <div className={styles.marketCardPriceRow}>
              <span className={styles.marketCardPrice}>{product.price} ₽</span>
              {oldPrice && <span className={styles.marketCardOldPrice}>{oldPrice} ₽</span>}
            </div>
          </div>
        </a>
      </Link>
      <motion.button
        className={styles.marketCardBtn}
        whileTap={outOfStock ? {} : { scale: 0.97 }}
        onClick={e => { e.preventDefault(); addToCart(); }}
        disabled={outOfStock}
        style={outOfStock ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
        aria-disabled={outOfStock}
      >
        <FaShoppingCart className={styles.marketCardBtnIcon} /> {outOfStock ? 'Нет в наличии' : 'В корзину'}
      </motion.button>
    </motion.div>
  );
}
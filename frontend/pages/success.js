import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaCheckCircle } from 'react-icons/fa';
import styles from '../styles/Success.module.css';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function Success() {
  const router = useRouter();
  const { orderNumber } = router.query;
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(!!Cookies.get('token'));
    window.dispatchEvent(new Event('authChange'));
  }, []);

  return (
    <div className={styles.successPageWrap}>
      <Head>
        <title>Заказ успешно оформлен! | SanRottan</title>
        <meta name="description" content="Ваш заказ успешно оформлен! Спасибо за покупку в SanRottan. Мы свяжемся с вами для подтверждения заказа." />
        <meta name="keywords" content="успех, заказ, оформлен, SanRottan, интернет-магазин" />
        <meta property="og:title" content="Заказ успешно оформлен! | SanRottan" />
        <meta property="og:description" content="Ваш заказ успешно оформлен! Спасибо за покупку в SanRottan. Мы свяжемся с вами для подтверждения заказа." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sanrottan.ru/success" />
      </Head>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={styles.successContainer}
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 0.8, repeat: 1 }}
          className={styles.successIconWrap}
        >
          <FaCheckCircle className={styles.successIcon} />
        </motion.div>
        <h1 className={styles.title}>Заказ успешно оформлен!</h1>
        <div className={styles.message}>
          Ваш заказ <b>№{orderNumber}</b> принят.<br />
          Скоро с вами свяжется наш менеджер.
        </div>
        <div className={styles.buttonGroup}>
          {isAuth ? (
            <Link href="/account" className={styles.successBtn}>В профиль</Link>
          ) : (
            <Link href="/register" className={styles.successBtn}>Зарегистрироваться</Link>
          )}
          <Link href="/shop" className={styles.successLink}>Продолжить покупки</Link>
        </div>
      </motion.div>
    </div>
  );
}
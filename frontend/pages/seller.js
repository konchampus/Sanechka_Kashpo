import { motion } from 'framer-motion';
import styles from '../styles/Home.module.css';
import Head from 'next/head';

export default function Seller() {
  return (
    <>
      <Head>
        <title>Стать продавцом | SanRottan</title>
        <meta name="description" content="Присоединяйтесь к команде SanRottan. Возможности для продавцов и партнеров." />
        <meta name="keywords" content="продавец, партнер, сотрудничество, SanRottan" />
        <meta property="og:title" content="Стать продавцом | SanRottan" />
        <meta property="og:description" content="Присоединяйтесь к команде SanRottan. Возможности для продавцов и партнеров." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sanrottan.ru/seller" />
      </Head>
      <div className={styles.container}>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Стать продавцом
        </motion.h1>
        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Присоединяйтесь к нашей команде и зарабатывайте вместе с нами
        </motion.p>
        
        <div className={styles.sellerGrid}>
          <motion.div
            className={styles.sellerCard}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.sellerIcon}>💼</div>
            <h3 className={styles.sellerTitle}>Преимущества</h3>
            <ul className={styles.sellerList}>
              <li>Высокий доход</li>
              <li>Гибкий график</li>
              <li>Обучение и поддержка</li>
              <li>Готовые материалы</li>
            </ul>
          </motion.div>
          
          <motion.div
            className={styles.sellerCard}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className={styles.sellerIcon}>📈</div>
            <h3 className={styles.sellerTitle}>Требования</h3>
            <ul className={styles.sellerList}>
              <li>Опыт в продажах</li>
              <li>Коммуникабельность</li>
              <li>Ответственность</li>
              <li>Желание развиваться</li>
            </ul>
          </motion.div>
          
          <motion.div
            className={styles.sellerCard}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className={styles.sellerIcon}>🎯</div>
            <h3 className={styles.sellerTitle}>Задачи</h3>
            <ul className={styles.sellerList}>
              <li>Поиск клиентов</li>
              <li>Консультации</li>
              <li>Оформление заказов</li>
              <li>Сопровождение сделок</li>
            </ul>
          </motion.div>
          
          <motion.div
            className={styles.sellerCard}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className={styles.sellerIcon}>💰</div>
            <h3 className={styles.sellerTitle}>Оплата</h3>
            <ul className={styles.sellerList}>
              <li>Процент с продаж</li>
              <li>Бонусы за объем</li>
              <li>Премии за качество</li>
              <li>Стабильный доход</li>
            </ul>
          </motion.div>
        </div>
        
        <motion.div
          className={styles.ctaBlock}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <h2>Готовы присоединиться?</h2>
          <p>Свяжитесь с нами для обсуждения условий сотрудничества</p>
          <a href="https://t.me/Sanrottan" target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
            Написать в Telegram
          </a>
        </motion.div>
      </div>
    </>
  );
}
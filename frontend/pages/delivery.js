import { motion } from 'framer-motion';
import styles from '../styles/Home.module.css';
import Head from 'next/head';
import FAQ from '../components/FAQ';

export default function Delivery() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Доставка и оплата | SanRottan</title>
        <meta name="description" content="Условия доставки и оплаты изделий из ротанга. СДЭК, Почта России, наличные, карта." />
        <meta name="keywords" content="доставка, оплата, SanRottan, ротанг, СДЭК, почта России" />
        <meta property="og:title" content="Доставка и оплата | SanRottan" />
        <meta property="og:description" content="Условия доставки и оплаты изделий из ротанга. СДЭК, Почта России, наличные, карта." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sanrottan.ru/delivery" />
      </Head>
      <motion.h1
        className={styles.title}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Доставка и оплата
      </motion.h1>
      <motion.p
        className={styles.subtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Мы предлагаем удобные и быстрые способы доставки и оплаты для вашего комфорта
      </motion.p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', margin: '40px 0' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 28, minWidth: 280, maxWidth: 400, flex: '1 1 320px' }}
        >
          <h3 style={{ color: 'var(--accent-brown)', fontFamily: 'Sinoreta, serif', fontSize: '1.3rem', marginBottom: 12 }}>Доставка</h3>
          <ul style={{ textAlign: 'left', color: 'var(--primary-text)', fontSize: '1.05rem', marginBottom: 0, paddingLeft: 0, listStyle: 'none' }}>
            <li style={{ marginBottom: 12 }}><b>Самовывоз</b><br />Вы можете забрать свой заказ в нашей мастерской, пос. Светлый 10.00 до 20.00 по предварительной договоренности</li>
            <li style={{ marginBottom: 12 }}><b>Доставка по Магнитогорску</b><br />Доставка курьером в любую точку города: бесплатная от 3000₽</li>
            <li><b>Доставка по России</b><br />Доставку заказов по всей территории РФ с помощью СДЭК, Почта России.</li>
          </ul>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 28, minWidth: 280, maxWidth: 400, flex: '1 1 320px' }}
        >
          <h3 style={{ color: 'var(--accent-brown)', fontFamily: 'Sinoreta, serif', fontSize: '1.3rem', marginBottom: 12 }}>Покупайте с комфортом</h3>
          <ul style={{ textAlign: 'left', color: 'var(--primary-text)', fontSize: '1.05rem', marginBottom: 0, paddingLeft: 0, listStyle: 'none' }}>
            <li style={{ marginBottom: 12 }}><b>Оплата наличными</b><br />Оплачивайте товар наличными курьеру при получении заказа или в мастерской</li>
            <li style={{ marginBottom: 12 }}><b>Безналичный расчет</b><br />При помощи расчетного счета организации</li>
            <li><b>Банковской картой</b><br />Оплачивайте товар картой онлайн</li>
          </ul>
        </motion.div>
      </div>
      <motion.div
        className={styles.ctaBlock}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
      >
        <h2>Остались вопросы?</h2>
        <p>Свяжитесь с нами для уточнения деталей доставки и оплаты</p>
        <a href="https://t.me/Sanrottan" target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
          Спросить в Telegram
        </a>
      </motion.div>
      <div style={{ marginTop: 40 }}>
      </div>
    </div>
  );
}
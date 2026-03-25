import { motion } from 'framer-motion';
import styles from '../styles/Home.module.css';
import Head from 'next/head';

export default function Contacts() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Контакты | SanRottan</title>
        <meta name="description" content="Свяжитесь с нами для заказа изделий из ротанга. Телефон, WhatsApp, адрес мастерской." />
        <meta name="keywords" content="контакты, SanRottan, ротанг, заказ, телефон, адрес" />
        <meta property="og:title" content="Контакты | SanRottan" />
        <meta property="og:description" content="Свяжитесь с нами для заказа изделий из ротанга. Телефон, WhatsApp, адрес мастерской." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sanrottan.ru/contacts" />
      </Head>
      <motion.h1
        className={styles.title}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Контакты
      </motion.h1>
      <motion.p
        className={styles.subtitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Свяжитесь с нами удобным способом для заказа изделий из ротанга
      </motion.p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', margin: '40px 0' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 28, minWidth: 260, maxWidth: 340, flex: '1 1 260px' }}
        >
          <h3 style={{ color: 'var(--accent-brown)', fontFamily: 'Sinoreta, serif', fontSize: '1.15rem', marginBottom: 10 }}>Телефон</h3>
          <p style={{ color: 'var(--primary-text)', fontSize: 17, marginBottom: 8 }}>+7 (912) 772-18-18</p>
          <a href="tel:+79127721818" style={{ color: '#4A7043', fontWeight: 500, textDecoration: 'underline' }}>Позвонить</a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 28, minWidth: 260, maxWidth: 340, flex: '1 1 260px' }}
        >
          <h3 style={{ color: 'var(--accent-brown)', fontFamily: 'Sinoreta, serif', fontSize: '1.15rem', marginBottom: 10 }}>Telegram</h3>
          <p style={{ color: 'var(--primary-text)', fontSize: 17, marginBottom: 8 }}>@Sanrottan</p>
          <a href="https://t.me/Sanrottan" target="_blank" rel="noopener noreferrer" style={{ color: '#4A7043', fontWeight: 500, textDecoration: 'underline' }}>Написать</a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 28, minWidth: 260, maxWidth: 340, flex: '1 1 260px' }}
        >
          <h3 style={{ color: 'var(--accent-brown)', fontFamily: 'Sinoreta, serif', fontSize: '1.15rem', marginBottom: 10 }}>VK / Instagram / Telegram Канал</h3>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <a href="https://vk.com/sanrottan" target="_blank" rel="noopener noreferrer" aria-label="VK">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#E8D9B8"/><path d="M12.714 17C7.248 17 4.13 13.246 4 7h2.738c.09 4.585 2.109 6.527 3.708 6.927V7h2.578v3.954c1.58-.17 3.238-1.972 3.798-3.954H19.4c-.43 2.442-2.228 4.244-3.507 4.985 1.279.6 3.328 2.172 4.107 5.015h-2.838c-.61-1.902-2.129-3.373-4.138-3.574V17h-.31z" fill="#7A5C3A"/></svg>
            </a>
            <a href="https://instagram.com/sanrottan" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#E8D9B8"/><rect x="11" y="11" width="14" height="14" rx="5" stroke="#7A5C3A" strokeWidth="2"/><circle cx="18" cy="18" r="4" stroke="#7A5C3A" strokeWidth="2"/><circle cx="24.2" cy="12.2" r="1.2" fill="#7A5C3A"/></svg>
            </a>
            <a href="https://t.me/Sanrottan74" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#E8D9B8"></circle><path d="M11 18.5L25 13.5C25.5 13.3 26 13.7 25.9 14.3L23.6 25.1C23.5 25.7 22.7 25.9 22.3 25.4L18.7 21.1C18.3 20.6 17.5 20.6 17.1 21.1L15.2 23.7C14.8 24.2 14 24 13.9 23.4L11.1 19.1C10.8 18.7 11.2 18.3 11.7 18.5Z" stroke="#7A5C3A" stroke-width="2" fill="#E8D9B8"></path></svg>
            </a>
          </div>
          <span style={{ color: '#4A7043', fontWeight: 500 }}>vk.com/sanrottan<br/>instagram.com/sanrottan<br/>t.me/sanrottan74</span>
        </motion.div>
      </div>
      <motion.div
        className={styles.ctaBlock}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
      >
        <h2>Готовы заказать?</h2>
        <p>Свяжитесь с нами любым удобным способом, и мы поможем выбрать идеальное изделие для вашего дома</p>
        <a href="https://t.me/Sanrottan" target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
          Заказать в Telegram
        </a>
      </motion.div>
    </div>
  );
}
import { motion } from 'framer-motion';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Custom404() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Страница не найдена — 404 | SanRottan</title>
        <meta name="description" content="Страница не найдена. Перейдите на главную или воспользуйтесь поиском по каталогу." />
        <meta name="keywords" content="404, страница не найдена, ошибка, SanRottan" />
        <meta property="og:title" content="Страница не найдена — 404 | SanRottan" />
        <meta property="og:description" content="Страница не найдена. Перейдите на главную или воспользуйтесь поиском по каталогу." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sanrottan.ru/404" />
      </Head>
      <div className={styles.errorContainer}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={styles.errorCard}
        >
          <h1 className={styles.errorTitle}>404</h1>
          <h2 className={styles.errorSubtitle}>Страница не найдена</h2>
          <p className={styles.errorText}>К сожалению, такой страницы не существует.<br/>Проверьте адрес или перейдите на главную.</p>
          <a href="/" className={styles.errorBtn}>На главную</a>
        </motion.div>
      </div>
    </div>
  );
}
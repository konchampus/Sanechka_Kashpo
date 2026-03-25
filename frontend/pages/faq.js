import { motion } from 'framer-motion';
import styles from '../styles/Home.module.css';
import FAQ from '../components/FAQ';
import Head from 'next/head';

export default function FAQPage() {
  return (
    <>
      <Head>
        <title>Часто задаваемые вопросы | SanRottan</title>
        <meta name="description" content="Ответы на часто задаваемые вопросы о ротанге, уходе, доставке и оплате." />
        <meta name="keywords" content="FAQ, вопросы, ротанг, уход, доставка, SanRottan" />
        <meta property="og:title" content="Часто задаваемые вопросы | SanRottan" />
        <meta property="og:description" content="Ответы на часто задаваемые вопросы о ротанге, уходе, доставке и оплате." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sanrottan.ru/faq" />
      </Head>
      <div className={styles.container}>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Часто задаваемые вопросы
        </motion.h1>
        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Ответы на самые популярные вопросы о ротанге и наших изделиях
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <FAQ />
        </motion.div>
      </div>
    </>
  );
}
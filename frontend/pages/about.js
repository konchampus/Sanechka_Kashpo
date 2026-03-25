import { motion } from 'framer-motion';
import styles from '../styles/About.module.css';
import Head from 'next/head';

export default function About() {
  return (
    <>
      <Head>
        <title>О компании SanRottan — производство изделий из ротанга</title>
        <meta name="description" content="О компании SanRottan: производство мебели и декора из ротанга, мастерская, натуральные материалы, индивидуальный подход." />
        <meta name="keywords" content="ротанг, производство, мастерская, SanRottan, мебель, декор, о компании" />
        <meta property="og:title" content="О компании SanRottan — производство изделий из ротанга" />
        <meta property="og:description" content="О компании SanRottan: производство мебели и декора из ротанга, мастерская, натуральные материалы, индивидуальный подход." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sanrottan.ru/about" />
      </Head>
      <div className={styles.aboutContainer}>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          SanRottan: Природный, Вдохновение, Уют
        </motion.h1>
        <motion.p
          className={styles.description}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Мы создаем изделия из ротанга, которые дышат природной гармонией и приносят тепло в ваш дом. SanRottan – это синоним эстетики, непревзойдённой прочности и уникального стиля. Каждое изделие – это результат тщательного отбора лучших лоз ротанга и мастерства наших рук.
        </motion.p>
        <motion.h2
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Выбирая SanRottan, вы выбираете:
        </motion.h2>
        <motion.ul
          className={styles.advList}
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.13 } } }}
        >
          <motion.li className={styles.advCard} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <strong>Натуральность:</strong> Чистый, возобновляемый материал без вредных примесей.
          </motion.li>
          <motion.li className={styles.advCard} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <strong>Долговечность:</strong> Исключительная прочность ротанга для поколений в вашей семье.
          </motion.li>
          <motion.li className={styles.advCard} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <strong>Уникальность:</strong> Каждое изделие обладает своим неповторимым характером.
          </motion.li>
          <motion.li className={styles.advCard} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <strong>Стиль:</strong> Тёплая текстура и изящные формы для любого интерьера.
          </motion.li>
        </motion.ul>
        <motion.p
          className={styles.footerText}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Окружите себя красотой природы с SanRottan.
        </motion.p>
        <motion.div
          className={styles.photoGallery}
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.img
            src="/images/about1.jpg"
            alt="Ротанг"
            className={styles.photo}
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
          />
          <motion.img
            src="/images/about2.jpg"
            alt="Изделия"
            className={styles.photo}
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
          />
          <motion.img
            src="/images/about3.jpg"
            alt="Мастерская"
            className={styles.photo}
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
          />
        </motion.div>
      </div>
    </>
  );
}
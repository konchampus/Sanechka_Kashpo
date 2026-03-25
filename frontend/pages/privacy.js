import { motion } from 'framer-motion';
import styles from '../styles/Home.module.css';
import Head from 'next/head';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Политика конфиденциальности | SanRottan</title>
        <meta name="description" content="Политика конфиденциальности SanRottan. Как мы обрабатываем и защищаем ваши персональные данные." />
        <meta name="keywords" content="политика конфиденциальности, персональные данные, SanRottan" />
        <meta property="og:title" content="Политика конфиденциальности | SanRottan" />
        <meta property="og:description" content="Политика конфиденциальности SanRottan. Как мы обрабатываем и защищаем ваши персональные данные." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sanrottan.ru/privacy" />
      </Head>
      <div className={styles.container}>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Политика конфиденциальности
        </motion.h1>
        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Как мы обрабатываем и защищаем ваши персональные данные
        </motion.p>
        
        <motion.div
          className={styles.privacyContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.privacySection}>
            <h2 className={styles.privacySectionTitle}>1. Общие положения</h2>
            <p className={styles.privacyText}>
              Настоящая Политика конфиденциальности определяет порядок обработки персональных данных пользователей сайта SanRottan. 
              Мы стремимся обеспечить максимальную защиту вашей конфиденциальности.
            </p>
          </div>
          
          <div className={styles.privacySection}>
            <h2 className={styles.privacySectionTitle}>2. Собираемые данные</h2>
            <p className={styles.privacyText}>
              Мы собираем только те данные, которые необходимы для обработки заказов и улучшения качества обслуживания:
            </p>
            <ul className={styles.privacyList}>
              <li>Имя и фамилия</li>
              <li>Номер телефона</li>
              <li>Email адрес (опционально)</li>
              <li>Адрес доставки</li>
              <li>Информация о заказах</li>
            </ul>
          </div>
          
          <div className={styles.privacySection}>
            <h2 className={styles.privacySectionTitle}>3. Цель использования</h2>
            <p className={styles.privacyText}>
              Ваши персональные данные используются исключительно для:
            </p>
            <ul className={styles.privacyList}>
              <li>Обработки и выполнения заказов</li>
              <li>Связи с вами по вопросам заказа</li>
              <li>Улучшения качества обслуживания</li>
              <li>Отправки уведомлений о статусе заказа</li>
            </ul>
          </div>
          
          <div className={styles.privacySection}>
            <h2 className={styles.privacySectionTitle}>4. Защита данных</h2>
            <p className={styles.privacyText}>
              Мы принимаем все необходимые меры для защиты ваших персональных данных от несанкционированного доступа, 
              изменения, раскрытия или уничтожения. Используются современные методы шифрования и защиты.
            </p>
          </div>
          
          <div className={styles.privacySection}>
            <h2 className={styles.privacySectionTitle}>5. Передача данных</h2>
            <p className={styles.privacyText}>
              Мы не передаем ваши персональные данные третьим лицам, за исключением случаев, 
              когда это необходимо для выполнения заказа (службы доставки) или требуется по закону.
            </p>
          </div>
          
          <div className={styles.privacySection}>
            <h2 className={styles.privacySectionTitle}>6. Ваши права</h2>
            <p className={styles.privacyText}>
              Вы имеете право на получение информации о том, какие данные мы храним, 
              их исправление или удаление. Для этого свяжитесь с нами любым удобным способом.
            </p>
          </div>
          
          <div className={styles.privacySection}>
            <h2 className={styles.privacySectionTitle}>7. Контакты</h2>
            <p className={styles.privacyText}>
              По всем вопросам, связанным с обработкой персональных данных, 
              обращайтесь к нам по телефону или через WhatsApp.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
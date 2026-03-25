import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../lib/axios';
import BannerSlider from '../components/BannerSlider';
import ProductCard from '../components/ProductCard';
import { getImageUrl } from '../lib/utils';
import { showSuccess, showError, showWarning, showFileNotification } from '../lib/notifications';
import styles from '../styles/Home.module.css';
import Head from 'next/head';
import Cookies from 'js-cookie';

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [galleryModal, setGalleryModal] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    // Проверяем подключение к серверу
    axios.get('/api/banners')
      .then(res => setBanners(res.data))
      .catch(error => {
        console.error('Ошибка загрузки баннеров:', error);
        if (error.code === 'NETWORK_ERROR') {
          console.error('Network error - проверьте, что сервер запущен на http://localhost:5000');
        }
      });
    
    axios.get('/api/products')
      .then(res => setProducts(res.data))
      .catch(error => {
        console.error('Ошибка загрузки товаров:', error);
        if (error.code === 'NETWORK_ERROR') {
          console.error('Network error - проверьте, что сервер запущен на http://localhost:5000');
        }
      });
    
    axios.get('/api/photos')
      .then(res => setPhotos(res.data))
      .catch(error => {
        console.error('Ошибка загрузки фото:', error);
        if (error.code === 'NETWORK_ERROR') {
          console.error('Network error - проверьте, что сервер запущен на http://localhost:5000');
        }
      });
    
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      setIsAdmin(role === 'admin');
    }
  }, []);

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!photoFile) return;
    
    const token = Cookies.get('token');
    const role = Cookies.get('role');
    
    if (!token) {
      showError('Необходимо авторизоваться');
      return;
    }
    
    if (role !== 'admin') {
      showError('Недостаточно прав для загрузки фото');
      return;
    }
    
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('name', photoFile.name);
    
    try {
      await axios.post('/api/photos', formData);
      showSuccess('Фото успешно загружено!');
      setPhotoFile(null);
      axios.get('/api/photos').then(res => setPhotos(res.data));
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      showError('Ошибка загрузки фото');
    }
  };

  const handleRemovePhoto = async (id) => {
    const token = Cookies.get('token');
    const role = Cookies.get('role');
    
    if (!token) {
      showError('Необходимо авторизоваться');
      return;
    }
    
    if (role !== 'admin') {
      showError('Недостаточно прав для удаления фото');
      return;
    }
    
    try {
      await axios.delete(`/api/photos/${id}`);
      showSuccess('Фото успешно удалено!');
      axios.get('/api/photos').then(res => setPhotos(res.data));
    } catch (error) {
      console.error('Ошибка удаления фото:', error);
      showError('Ошибка удаления фото');
    }
  };

  const isVideo = url => url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov'));
  // Заменяю все <CustomVideoPlayer ... /> на импортированный компонент

  return (
    <>
      <Head>
        <title>SanRottan — интернет-магазин изделий из ротанга: мебель, декор, кашпо</title>
        <meta name="description" content="SanRottan — магазин стильных изделий из ротанга: мебель, декор, кашпо. Купить ротанг в Москве, СПб, по России. Большой выбор, быстрая доставка." />
        <meta name="keywords" content="ротанг, купить ротанг, мебель из ротанга, декор, кашпо, SanRottan, интернет-магазин" />
        <meta property="og:title" content="SanRottan — интернет-магазин изделий из ротанга: мебель, декор, кашпо" />
        <meta property="og:description" content="SanRottan — магазин стильных изделий из ротанга: мебель, декор, кашпо. Купить ротанг в Москве, СПб, по России. Большой выбор, быстрая доставка." />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sanrottan.ru/" />
      </Head>
      <div className={styles.container}>
          {/* Удаляю компонент BannerSlider или любой блок с объявлениями/акциями/баннерами */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className={styles.title}>
            Добро пожаловать в SanRottan
          </h1>
          <p className={styles.subtitle}>
            Магазин стильных изделий из ротанга: кашпо, мебель, декор. Натуральные материалы, уют и тепло в каждый дом.
          </p>
          
          <motion.section
            className={styles.whySection}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className={styles.galleryTitle}>Почему выбирают SanRottan?</h2>
            <div className={styles.whyGrid}>
              <div className={styles.whyCard}>
                <span className={styles.whyCardIcon}>🌱</span>
                <h3>Натуральные материалы</h3>
                <p>Только экологически чистый ротанг и дерево.</p>
              </div>
              <div className={styles.whyCard}>
                <span className={styles.whyCardIcon}>🪑</span>
                <h3>Дизайн и уют</h3>
                <p>Современные формы, тёплые оттенки, уют в каждый дом.</p>
              </div>
              <div className={styles.whyCard}>
                <span className={styles.whyCardIcon}>🚚</span>
                <h3>Быстрая доставка</h3>
                <p>Оперативная доставка по всей России и СНГ.</p>
              </div>
              <div className={styles.whyCard}>
                <span className={styles.whyCardIcon}>💬</span>
                <h3>Поддержка</h3>
                <p>Всегда на связи: WhatsApp, VK, Instagram.</p>
              </div>
            </div>
          </motion.section>
          <motion.section
            className={styles.aboutSection}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className={styles.galleryTitle}>О нас</h2>
            <p className={styles.aboutText}>
              SanRottan — это команда мастеров, которые создают уникальные изделия из ротанга с любовью и вниманием к деталям. Мы верим, что натуральные материалы и ручная работа делают дом по-настоящему уютным.
            </p>
          </motion.section>
          <h2 className={styles.galleryTitle}>Галерея</h2>
          <motion.div
            className={styles.galleryGrid}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.10 } } }}
          >
            {photos.length === 0 ? (
              <div className={styles.emptyBlock}>
                <div className={styles.emptyImg}>📸</div>
                <div className={styles.emptyText}>Фото не найдены</div>
              </div>
            ) : (
              photos.map((photo, idx) => (
                <motion.div
                  key={photo._id}
                  className={styles.photoWrap}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => setGalleryModal(photos)}
                  onDragStart={(e) => e.preventDefault()} // Prevent default drag behavior
                  onDragEnd={(e) => {
                    const newIndex = photos.findIndex(p => p._id === photo._id);
                    if (newIndex !== -1) {
                      const [movedItem] = photos.splice(idx, 1);
                      photos.splice(newIndex, 0, movedItem);
                      setPhotos([...photos]);
                    }
                  }}
                >
                  {isVideo(photo.url) ? (
                    <video src={getImageUrl(photo.url)} style={{ borderRadius: 14, background: '#000', maxHeight: 420, width: '100%', objectFit: 'contain' }} controls autoPlay playsInline />
                  ) : (
                    <img src={getImageUrl(photo.url)} alt={photo.name} className={styles.photo} />
                  )}
                  {isAdmin && (
                    <button
                      className={styles.removePhotoBtn}
                      onClick={() => handleRemovePhoto(photo._id)}
                    >
                      Удалить
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
          {isAdmin && (
            <form onSubmit={handleAddPhoto} className={styles.uploadForm}>
              <input
                type="file"
                className={styles.fileInput}
                onChange={(e) => setPhotoFile(e.target.files[0])}
              />
              <button type="submit" className={styles.uploadBtn}>
                Добавить фото
              </button>
            </form>
          )}
          <motion.div
            className={styles.ctaBlock}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2>Хотите украсить дом?</h2>
            <p>Выберите изделие из каталога или напишите нам — мы поможем подобрать идеальный вариант!</p>
            <a href="/shop" className={styles.ctaBtn}>
              Перейти в каталог
            </a>
          </motion.div>
        </motion.section>
      </div>
      {galleryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'zoom-out',
          }}
          onClick={() => setGalleryModal(null)}
        >
          {isVideo(galleryModal[galleryIndex].url) ? (
            <video src={getImageUrl(galleryModal[galleryIndex].url)} style={{ borderRadius: 14, background: '#000', maxHeight: '80vh', width: 'auto', maxWidth: '80vw' }} controls autoPlay playsInline />
          ) : (
            <img
              src={getImageUrl(galleryModal[galleryIndex].url)}
              alt={galleryModal[galleryIndex].name}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                borderRadius: 14,
                cursor: 'zoom-out',
              }}
            />
          )}
        </div>
      )}
    </>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from '../../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import FAQ from '../../components/FAQ';
import ProductCard from '../../components/ProductCard';
import styles from '../../styles/Product.module.css';
import Head from 'next/head';
import { FaShoppingCart, FaPercent, FaCheckCircle, FaStar, FaExpand, FaPlay, FaTimes } from 'react-icons/fa';
import { getImageUrl } from '../../lib/utils';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import CustomVideoPlayer from '../../components/CustomVideoPlayer';

export default function Product() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const swiperRef = useRef();

  useEffect(() => {
    if (id) {
      const is12Digit = typeof id === 'string' && /^\d{12}$/.test(id);
      const url = is12Digit ? `/api/products/by-id/${id}` : `/api/products/${id}`;
      axios.get(url)
        .then(res => setProduct(res.data))
        .catch(() => setProduct(false));
      axios.get('/api/products').then(res => {
        const filtered = res.data.filter(p => (is12Digit ? p.productId !== id : p._id !== id)).slice(0, 4);
        setRelatedProducts(filtered);
      });
    }
  }, [id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    // selectedOptions — массив имён выбранных опций
    const selectedOpts = Array.isArray(selectedOptions) && product.options
      ? product.options.filter(opt => selectedOptions.includes(opt.name))
      : [];
    const existingItem = cart.find(item => item._id === product._id && JSON.stringify(item.selectedOptions || []) === JSON.stringify(selectedOptions));
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.selectedOptions = selectedOptions;
      existingItem.options = product.options || [];
    } else {
      cart.push({
        ...product,
        quantity,
        selectedOptions,
        options: product.options || []
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('authChange'));
    toast.success(`${product.name} добавлен в корзину!`);
  };

  if (product === false) {
    return (
      <div className={styles.loading} style={{ color: '#a68a64', fontSize: 22, textAlign: 'center', marginTop: 60 }}>
        Товар не найден или продан.<br />
        <a href="/shop" style={{ color: '#7A5C3A', textDecoration: 'underline', fontWeight: 600 }}>Вернуться в каталог</a>
      </div>
    );
  }

  if (!product) return <div className={styles.loading}>Загрузка...</div>;

  const media = [
    ...(product.images || []),
    ...(product.videos || [])
  ];
  const isVideo = (url) => url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov'));

  const oldPrice = product?.oldPrice;
  const discount = oldPrice ? Math.round(100 - product.price / oldPrice * 100) : 0;

  const metaTitle = product ? `${product.name} — купить в SanRottan` : 'Товар | SanRottan';
  const metaDesc = product ? (product.description || `Купить ${product.name} из ротанга. Натуральные материалы, быстрая доставка по России.`) : 'Товар из ротанга, SanRottan.';
  const metaKeywords = product ? `${product.name}, ротанг, купить, SanRottan, мебель, декор` : 'ротанг, купить, SanRottan, мебель, декор';
  const metaImage = product && product.images && product.images[0] ? (product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`) : '/images/logo.png';

  // --- Контроль остатков ---
  const inStock = typeof product.stock === 'number' ? product.stock : 999999;
  const canBuy = inStock > 0;

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={metaKeywords} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://sanrottan.ru/product/${id}`} />
      </Head>
      <div className={styles.productPage}>
        <div className={styles.productContainer}>
          <div className={styles.leftCol}>
            <div className={styles.productSliderWrap}>
              <div className={styles.productSlider}>
                {isVideo(media[galleryIndex]) ? (
                  <CustomVideoPlayer
                    src={getImageUrl(media[galleryIndex])}
                    className={styles.productImg}
                  />
                ) : (
                  <img
                    src={getImageUrl(media[galleryIndex])}
                    alt={product.name}
                    className={styles.productImg + ' unifiedImage'}
                    onClick={() => setIsGalleryOpen(true)}
                    style={{ cursor: 'zoom-in' }}
                    onError={e => { e.target.src = '/images/placeholder.jpg'; }}
                  />
                )}
                {isVideo(media[galleryIndex]) && (
                  <div className={styles.videoOverlay} onClick={() => setIsGalleryOpen(true)}>
                    <FaPlay size={48} color="#fff" />
                  </div>
                )}
              </div>
              <div className={styles.productThumbnails}>
                {media.map((url, idx) => (
                  <button
                    key={idx}
                    className={styles.productThumbnailBtn + (galleryIndex === idx ? ' ' + styles.productThumbnailBtnActive : '')}
                    onClick={() => setGalleryIndex(idx)}
                    aria-label={isVideo(url) ? 'Видео' : 'Фото'}
                    type="button"
                  >
                    {isVideo(url) ? (
                      <video
                        src={getImageUrl(url)}
                        className={styles.productThumbnailImg}
                        muted
                        playsInline
                        preload="metadata"
                        style={{ objectFit: 'cover', background: '#000', borderRadius: 10 }}
                        onLoadedMetadata={e => e.target.currentTime = 0.1}
                      />
                    ) : (
                      <img
                        src={getImageUrl(url)}
                        alt={product.name}
                        className={styles.productThumbnailImg}
                        onError={e => { e.target.src = '/images/placeholder.jpg'; }}
                      />
                    )}
                  </button>
                ))}
              </div>
              {/* Модальное окно галереи */}
              <AnimatePresence>
                {isGalleryOpen && (
                  <motion.div className={styles.galleryModal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className={styles.galleryModalContent} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                      <button className={styles.closeModalBtn} onClick={() => setIsGalleryOpen(false)} aria-label="Закрыть">×</button>
                      <Swiper
                        className={styles.modalSwiper + ' mainSwiper'}
                        modules={[Navigation, Pagination, Keyboard]}
                        navigation={false}
                        pagination={{ clickable: true, dynamicBullets: true }}
                        keyboard={{ enabled: true }}
                        initialSlide={galleryIndex}
                        onSlideChange={swiper => setGalleryIndex(swiper.activeIndex)}
                        style={{ width: '100%', height: '100%' }}
                        onSwiper={swiper => (swiperRef.current = swiper)}
                      >
                        {media.map((url, idx) => (
                          <SwiperSlide key={idx} className={styles.modalSlide}>
                            <div className={styles.modalSlideContent}>
                              {isVideo(url) ? (
                                <CustomVideoPlayer src={getImageUrl(url)} className={styles.modalMedia} />
                              ) : (
                                <Zoom overlayBgColorEnd="rgba(0,0,0,0.95)" zoomMargin={40}>
                                  <img
                                    src={getImageUrl(url)}
                                    alt={product.name}
                                    className={styles.modalImage}
                                    style={{ borderRadius: 14, background: '#fff', maxHeight: 520, width: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
                                    onError={e => { e.target.src = '/images/placeholder.jpg'; }}
                                  />
                                </Zoom>
                              )}
                            </div>
                          </SwiperSlide>
                        ))}
                        {/* Кастомные стрелки */}
                        <button
                          type="button"
                          aria-label="Предыдущий"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: 12,
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            background: 'rgba(232,217,184,0.85)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#7A5C3A',
                            fontSize: 28,
                            boxShadow: '0 2px 8px rgba(122,92,58,0.10)',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onClick={() => swiperRef.current?.slidePrev()}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" stroke="#7A5C3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                        </button>
                        <button
                          type="button"
                          aria-label="Следующий"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: 12,
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            background: 'rgba(232,217,184,0.85)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#7A5C3A',
                            fontSize: 28,
                            boxShadow: '0 2px 8px rgba(122,92,58,0.10)',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onClick={() => swiperRef.current?.slideNext()}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="#7A5C3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                        </button>
                      </Swiper>
                      <div className={styles.modalNavigation}>
                        <span className={styles.modalCounter}>{galleryIndex + 1} / {media.length}</span>
                        <div className={styles.productThumbnails} style={{ marginTop: 18, justifyContent: 'center' }}>
                          {media.map((url, idx) => (
                            <button
                              key={idx}
                              className={styles.productThumbnailBtn + (galleryIndex === idx ? ' ' + styles.productThumbnailBtnActive : '')}
                              onClick={() => setGalleryIndex(idx)}
                              aria-label={isVideo(url) ? 'Видео' : 'Фото'}
                              type="button"
                            >
                              {isVideo(url) ? (
                                <video
                                  src={getImageUrl(url)}
                                  className={styles.productThumbnailImg}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  style={{ objectFit: 'cover', background: '#000', borderRadius: 10 }}
                                  onLoadedMetadata={e => e.target.currentTime = 0.1}
                                />
                              ) : (
                                <img
                                  src={getImageUrl(url)}
                                  alt={product.name}
                                  className={styles.productThumbnailImg}
                                  onError={e => { e.target.src = '/images/placeholder.jpg'; }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className={styles.rightCol}>
            <div className={styles.productInfo}>
              <h1 className={styles.productTitle}>{product.name}</h1>
              <div className={styles.productPriceRow}>
                <span className={styles.productPrice}>{product.price} ₽</span>
                {oldPrice && <span className={styles.productOldPrice}>{oldPrice} ₽</span>}
                {discount > 0 && <span className={styles.discountBadgeSm}>-{discount}%</span>}
              </div>
              <p className={styles.productDesc}>{product.description}</p>
              {product.characteristics && product.characteristics.length > 0 && (
                <ul className={styles.productChars}>
                  {product.characteristics.map((char, idx) => (
                    <li key={idx}>
                      <span>{char.key}:</span> {char.value}
                    </li>
                  ))}
                </ul>
              )}
              {product.options && product.options.length > 0 && (
                <div className={styles.extraServicesBlock}>
                  <h3 className={styles.extraServicesTitle}>Дополнительные услуги</h3>
                  <ul className={styles.extraServicesList}>
                    {product.options.map((opt, idx) => (
                      <li key={idx} className={styles.extraServiceItem}>
                        <label className={styles.extraServiceLabel}>
                          <input
                            type="checkbox"
                            checked={selectedOptions.includes(opt.name)}
                            onChange={e => {
                              setSelectedOptions(selectedOptions =>
                                e.target.checked
                                  ? [...selectedOptions, opt.name]
                                  : selectedOptions.filter(n => n !== opt.name)
                              );
                            }}
                          />
                          <span>{opt.name}</span>
                          {opt.price > 0 && <span className={styles.extraServicePrice}>+{opt.price} ₽</span>}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{ margin: '12px 0', color: '#4A7043', fontWeight: 500 }}>
                Остаток на складе: {inStock > 0 ? inStock : 'Нет в наличии'}
              </div>
              {canBuy ? (
                <>
                  <div className={styles.qtyRow}>
                    <label>Количество:</label>
                    <input
                      type="number"
                      min="1"
                      max={inStock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(inStock, parseInt(e.target.value) || 1)))}
                      className={styles.qtyInput}
                    />
                  </div>
                  <button onClick={addToCart} className={styles.cartBtn} disabled={quantity > inStock}>
                    <FaShoppingCart className={styles.cartBtnIcon} />
                    Добавить в корзину
                  </button>
                </>
              ) : (
                <div style={{ color: '#d9534f', fontWeight: 600, fontSize: 18, margin: '18px 0' }}>Нет в наличии</div>
              )}
            </div>
          </div>
        </div>
        {relatedProducts.length > 0 && (
          <div className={styles.relatedBlock}>
            <h2>Похожие товары</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
        <div className={styles.faqBlock}>
          <FAQ />
        </div>
      </div>
    </>
  );
}
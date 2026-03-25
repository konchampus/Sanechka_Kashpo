import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/Shop.module.css';
import Head from 'next/head';
import { getImageUrl } from '../lib/utils';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/categories').then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = '/api/products?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    axios.get(url)
      .then(res => {
        let filtered = res.data;
        if (priceMin) filtered = filtered.filter(p => p.price >= Number(priceMin));
        if (priceMax) filtered = filtered.filter(p => p.price <= Number(priceMax));
        filtered = filtered.filter(p => typeof p.stock !== 'number' || p.stock > 0); // скрыть нет в наличии
        setProducts(filtered);
      })
      .finally(() => setLoading(false));
  }, [search, category, priceMin, priceMax]);

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setPriceMin('');
    setPriceMax('');
  };

  const filterCategory = category; // Assuming category state holds the current filter
  const metaTitle = filterCategory ? `Категория: ${filterCategory} — купить в SanRottan` : 'Каталог товаров — SanRottan';
  const metaDesc = filterCategory ? `Купить изделия из ротанга категории ${filterCategory} в магазине SanRottan. Натуральные материалы, быстрая доставка по России.` : 'Каталог изделий из ротанга, мебель, декор. Быстрая доставка по России.';
  const metaKeywords = filterCategory ? `${filterCategory}, ротанг, купить, SanRottan, мебель, декор` : 'ротанг, купить, SanRottan, мебель, декор';
  const metaImage = '/images/logo.png';

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={metaKeywords} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://sanrottan.ru/products${filterCategory ? `?category=${encodeURIComponent(filterCategory)}` : ''}`} />
      </Head>
      <div className={styles.shopContainer}>
        <motion.h1 className="text-center mb-5" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          Каталог
        </motion.h1>
        <motion.div className={styles.filtersRow} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по названию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className={styles.categorySelect}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <button className={styles.resetBtn} onClick={resetFilters}>Сбросить</button>
        </motion.div>
        <div className={styles.productsGrid}>
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className={styles.skeletonCard}></div>
            ))
          ) : products.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#a68a64', fontSize: 20, marginTop: 40 }}>Товары не найдены</div>
          ) : (
            <AnimatePresence>
              {products.map(product => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(122,92,58,0.18)' }}
                  style={{ borderRadius: 16, background: '#fff', boxShadow: '0 4px 24px rgba(122,92,58,0.10)', marginBottom: 16 }}
                >
                  <img src={getImageUrl(product.images && product.images[0])} alt={product.name} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: '16px 16px 0 0' }} />
                  <div style={{ padding: 18 }}>
                    <h5 style={{ fontFamily: 'Sinoreta, serif', color: '#4A7043', fontSize: 20 }}>{product.name}</h5>
                    <p style={{ color: '#3A3A3A', fontWeight: 500 }}>{product.price} руб.</p>
                    <Link href={`/product/${product._id}`} className="btn btn-primary" style={{ borderRadius: 8, marginTop: 8 }}>
                      Подробнее
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}
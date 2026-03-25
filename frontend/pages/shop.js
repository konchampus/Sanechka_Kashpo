import { useState, useEffect } from 'react';
import axios from '../lib/axios';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';
import styles from '../styles/Shop.module.css';
import Head from 'next/head';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState('');

  useEffect(() => {
    axios.get('/api/categories').then(res => setCategories(res.data));
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    let url = '/api/products?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    const res = await axios.get(url);
    let filtered = res.data;
    if (priceMin) filtered = filtered.filter(p => p.price >= Number(priceMin));
    if (priceMax) filtered = filtered.filter(p => p.price <= Number(priceMax));
    if (sort === 'priceAsc') filtered = filtered.sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') filtered = filtered.sort((a, b) => b.price - a.price);
    if (sort === 'stockDesc') filtered = filtered.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    if (sort === 'stockAsc') filtered = filtered.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    if (sort === 'popularity') filtered = filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    setProducts(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category, priceMin, priceMax, sort]);

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setPriceMin('');
    setPriceMax('');
    setSort('');
  };

  // Динамические SEO
  let seoTitle = 'Каталог изделий из ротанга — купить мебель, декор | SanRottan';
  let seoDesc = 'Каталог изделий из ротанга: мебель, декор, кашпо. Купить ротанг в Москве, СПб, по России. Большой выбор, быстрая доставка, SanRottan.';
  let seoKeywords = 'ротанг, купить ротанг, мебель из ротанга, декор, кашпо, SanRottan, интернет-магазин, каталог';
  if (search) {
    seoTitle = `Поиск: «${search}» — купить ротанг, мебель, декор | SanRottan`;
    seoDesc = `Результаты поиска по запросу «${search}» в магазине SanRottan. Мебель, декор, кашпо из ротанга. Быстрая доставка по России.`;
    seoKeywords = `ротанг, поиск, ${search}, купить ротанг, мебель из ротанга, декор, SanRottan, интернет-магазин, каталог`;
  } else if (category) {
    seoTitle = `Категория: ${category} — купить ротанг, мебель, декор | SanRottan`;
    seoDesc = `Категория «${category}» — мебель, декор, кашпо из ротанга. Купить ротанг в Москве, СПб, по России. Большой выбор, быстрая доставка, SanRottan.`;
    seoKeywords = `ротанг, ${category}, купить ротанг, мебель из ротанга, декор, SanRottan, интернет-магазин, каталог`;
  }

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <meta name="keywords" content={seoKeywords} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://sanrottan.ru/shop${category ? `?category=${encodeURIComponent(category)}` : ''}${search ? `?search=${encodeURIComponent(search)}` : ''}`} />
      </Head>
      <div className={styles.shopContainer}>
        <h1 className={styles.shopTitle}>Каталог товаров</h1>
        <div className={styles.filtersRow}>
          <div className={styles.searchWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск по названию, артикулу или категории..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button 
                className={styles.clearSearchBtn} 
                onClick={() => setSearch('')} 
                title="Очистить"
              >
                <FaTimes />
              </button>
            )}
          </div>
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
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="">Сортировка</option>
            <option value="priceAsc">Цена: по возрастанию</option>
            <option value="priceDesc">Цена: по убыванию</option>
            <option value="stockDesc">В наличии: больше → меньше</option>
            <option value="stockAsc">В наличии: меньше → больше</option>
            <option value="popularity">По популярности</option>
          </select>
          <button className={styles.resetBtn} onClick={resetFilters}>Сбросить</button>
        </div>
        <div className={styles.productsGrid}>
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className={styles.skeletonCard}></div>
            ))
          ) : products.length === 0 ? (
            <div className={styles.emptyBlock}>
              <img src="/images/logo.png" alt="Нет товаров" className={styles.emptyImg} />
              <div className={styles.emptyText}>Товары не найдены</div>
            </div>
          ) : (
            <AnimatePresence>
              {products.map(product => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(122,92,58,0.18)' }}
                  className={styles.productCardWrap}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}
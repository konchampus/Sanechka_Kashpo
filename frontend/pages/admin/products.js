import { useState, useEffect, useRef } from 'react';
import axios from '../../lib/axios';
import { showSuccess, showError, showWarning, showFileNotification, showFormNotification } from '../../lib/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Admin.module.css';
import { FaTrashAlt, FaEye, FaPlus, FaBroom, FaSpinner } from 'react-icons/fa';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import Uploader from '../../components/Uploader'; // Замена
import { getImageUrl } from '../../lib/utils';
import { Tabs, Tab } from 'react-bootstrap';
import BackButton from '../../components/BackButton';
import Cookies from 'js-cookie';
// MediaManager больше не используется

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [modalProduct, setModalProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('main');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    color: '',
    description: '',
    images: [],
    media: [],
    characteristics: [{ key: '', value: '' }],
    services: [{ name: '', price: '' }],
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();
  const [step, setStep] = useState(0); // 0: main, 1: media, 2: chars, 3: services

  useEffect(() => {
    // Проверка роли на клиенте
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
        return;
      }
    }
    axios.get('/api/products').then(res => setProducts(res.data));
    axios.get('/api/categories').then(res => setCategories(res.data));
  }, []);

  // Синхронизация images/videos с media
  useEffect(() => {
    if (Array.isArray(formData.media)) {
      setFormData(fd => ({
        ...fd,
        images: formData.media.filter(f => (f.type ? f.type.startsWith('image') : (f.name||'').match(/\.(jpg|jpeg|png|gif|webp)$/i))).map(f => f),
        videos: formData.media.filter(f => (f.type ? f.type.startsWith('video') : (f.name||'').match(/\.(mp4|webm|mov)$/i))).map(f => f)
      }));
    }
    // eslint-disable-next-line
  }, [formData.media]);

  const handleAddCharacteristic = () => {
    setFormData({
      ...formData,
      characteristics: [...formData.characteristics, { key: '', value: '' }]
    });
  };

  const handleCharacteristicChange = (index, field, value) => {
    const updatedCharacteristics = formData.characteristics.map((char, i) =>
      i === index ? { ...char, [field]: value } : char
    );
    setFormData({ ...formData, characteristics: updatedCharacteristics });
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      media: [...(formData.media || []), ...files]
    });
  };

  const handleRemoveMedia = idx => {
    const newMedia = formData.media.filter((_, i) => i !== idx);
    setFormData({
      ...formData,
      images: newMedia.filter(f => f.type==='image').map(f=>f),
      videos: newMedia.filter(f => f.type==='video').map(f=>f)
    });
  };

  const handleDragMedia = (from, to) => {
    const arr = [...formData.media];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setFormData({
      ...formData,
      images: arr.filter(f => f.type==='image').map(f=>f),
      videos: arr.filter(f => f.type==='video').map(f=>f)
    });
  };

  const handleClearForm = () => {
    setFormData({ name: '', price: '', category: '', images: [], media: [] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Новый submit для wizard
  const handleNext = (e) => {
    e && e.preventDefault();
    // Валидация по шагу
    if (step === 0) {
      if (!formData.name || !formData.price || !formData.category) {
        showFormNotification('validate');
        return;
      }
    }
    if (step === 1) {
      let mediaArr = Array.isArray(formData.media) ? formData.media : (formData.media ? [formData.media] : []);
      if (mediaArr.length === 0) {
        showFormNotification('validate');
        return;
      }
    }
    setStep(s => s + 1);
  };
  const handlePrev = (e) => {
    e && e.preventDefault();
    setStep(s => Math.max(0, s - 1));
  };

  // Новый финальный submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    let mediaArr = Array.isArray(formData.media) ? formData.media : (formData.media ? [formData.media] : []);
    setIsUploading(true);
    try {
      const images = mediaArr
        .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(typeof f === 'string' ? f : f.url))
        .map(f => typeof f === 'string' ? f : f.url);
      const videos = mediaArr
        .filter(f => /\.(mp4|webm|mov)$/i.test(typeof f === 'string' ? f : f.url))
        .map(f => typeof f === 'string' ? f : f.url);
      await axios.post('/api/admin/products', {
        name: formData.name,
        price: formData.price,
        category: formData.category,
        stock: formData.stock || 0,
        color: formData.color || '',
        description: formData.description || '',
        characteristics: formData.characteristics || [],
        options: formData.services || [],
        images,
        videos
      });
      showSuccess('Товар успешно добавлен!');
      handleClearForm();
      axios.get('/api/products').then(res => setProducts(res.data));
      setStep(0);
    } catch (error) {
      showError('Ошибка добавления товара');
      console.error('Ошибка добавления товара:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await axios.delete(`/api/admin/products/${id}`);
      showSuccess('Товар успешно удален!');
      setProducts(products.filter(p => p._id !== id));
    } catch (error) {
      showError('Ошибка удаления товара');
      console.error('Ошибка удаления товара:', error);
    }
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(p =>
    (!filterName || p.name.toLowerCase().includes(filterName.toLowerCase())) &&
    (!filterCategory || p.category === filterCategory)
  );

  // Всегда массивы
  const characteristics = formData.characteristics || [];
  const services = formData.services || [];
  const cats = categories || [];
  const prods = products || [];

  return (
    <div className="container my-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.adminContainer}
      >
        <BackButton />
        <h1 className="text-center mb-5">Управление товарами</h1>
        {/* Пошаговая форма создания товара */}
        <form onSubmit={step === 3 ? handleSubmit : handleNext} style={{ marginBottom: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 24 }}>
          {step === 0 && (
            <>
              <div className="mb-3">
                <label className="form-label">Название товара</label>
                <input type="text" className="form-control" placeholder="Например: Кашпо, Стул..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Цена</label>
                <input type="number" className="form-control" placeholder="Цена" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} min={1} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Количество</label>
                <input type="number" className="form-control" placeholder="Склад, шт" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} min={0} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Категория</label>
                <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                  <option value="">Выберите категорию</option>
                  {cats.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Цвет</label>
                <input type="text" className="form-control" placeholder="Бежевый, Коричневый..." value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">Описание</label>
                <textarea className="form-control" placeholder="Описание товара..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
            </>
          )}
          {step === 1 && (
            <div>
              <label className="form-label">Медиа (фото и видео)</label>
              <Uploader
                endpoint="/api/admin/upload-media"
                initialMedia={formData.media}
                onUploadComplete={(media) => setFormData(prev => ({ ...prev, media }))}
              />
            </div>
          )}
          {step === 2 && (
            <div className="mb-3">
              <label className="form-label">Характеристики</label>
              {characteristics.map((char, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input type="text" className="form-control" placeholder="Название" value={char.key} onChange={e => setFormData({ ...formData, characteristics: characteristics.map((c, idx) => idx === i ? { ...c, key: e.target.value } : c) })} style={{ maxWidth: 180 }} />
                  <input type="text" className="form-control" placeholder="Значение" value={char.value} onChange={e => setFormData({ ...formData, characteristics: characteristics.map((c, idx) => idx === i ? { ...c, value: e.target.value } : c) })} style={{ maxWidth: 220 }} />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setFormData({ ...formData, characteristics: characteristics.filter((_, idx) => idx !== i) })} disabled={characteristics.length === 1}>×</button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={() => setFormData({ ...formData, characteristics: [...characteristics, { key: '', value: '' }] })}>+ Добавить характеристику</button>
            </div>
          )}
          {step === 3 && (
            <div className="mb-3">
              <label className="form-label">Дополнительные услуги (необязательно)</label>
              {services.map((srv, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input type="text" className="form-control" placeholder="Название услуги" value={srv.name} onChange={e => setFormData({ ...formData, services: services.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s) })} style={{ maxWidth: 180 }} />
                  <input type="number" className="form-control" placeholder="Цена" value={srv.price} onChange={e => setFormData({ ...formData, services: services.map((s, idx) => idx === i ? { ...s, price: e.target.value } : s) })} style={{ maxWidth: 120 }} />
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setFormData({ ...formData, services: services.filter((_, idx) => idx !== i) })} disabled={services.length === 1}>×</button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={() => setFormData({ ...formData, services: [...services, { name: '', price: '' }] })}>+ Добавить услугу</button>
            </div>
          )}
          <div className="mb-3 d-flex gap-2">
            {step > 0 && <button type="button" className="btn btn-secondary" onClick={handlePrev} disabled={isUploading}>Назад</button>}
            {step < 3 && <button type="submit" className="btn btn-primary flex-grow-1" disabled={isUploading}>Далее</button>}
            {step === 3 && <button type="submit" className="btn btn-primary flex-grow-1" disabled={isUploading}>{isUploading ? <FaSpinner className="fa-spin" /> : <FaPlus />} {isUploading ? 'Загрузка...' : 'Создать товар'}</button>}
            <button type="button" className="btn btn-secondary" onClick={handleClearForm} disabled={isUploading}>Очистить</button>
          </div>
        </form>
        {/* Фильтры и таблица товаров */}
        <div className="row mb-4 g-2 align-items-end">
          <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Поиск по названию..." value={filterName} onChange={e => setFilterName(e.target.value)} />
          </div>
          <div className="col-md-4">
            <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <button className="btn btn-secondary w-100" onClick={() => { setFilterName(''); setFilterCategory(''); }}><FaBroom /> Сбросить фильтры</button>
          </div>
        </div>
        <div className={styles.adminContainer}>
          <h2 className="mt-5">Список товаров</h2>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Фото</th>
                  <th>Название</th>
                  <th>Цена</th>
                  <th>Категория</th>
                  <th>В наличии</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product._id}>
                    <td>
                      <Zoom>
                        <img
                          src={getImageUrl(product.images && product.images[0])}
                          alt={product.name}
                          width="60"
                          height="60"
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                          onError={e => { e.target.src = '/images/placeholder.jpg'; }}
                        />
                      </Zoom>
                    </td>
                    <td>{product.name}</td>
                    <td>{product.price} ₽</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setModalProduct(product)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaEye /> Смотреть</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(product._id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaTrashAlt /> Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Модальное окно предпросмотра товара */}
        <AnimatePresence>
          {modalProduct && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalProduct(null)}
            >
              <motion.div
                className={styles.modalContent}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <h3>Редактировать товар</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await axios.put(`/api/admin/products/${modalProduct._id}`, {
                      name: modalProduct.name,
                      price: modalProduct.price,
                      category: modalProduct.category,
                      stock: modalProduct.stock,
                      color: modalProduct.color,
                      description: modalProduct.description,
                      characteristics: modalProduct.characteristics,
                      options: modalProduct.options,
                      images: modalProduct.images,
                      videos: modalProduct.videos
                    });
                    showSuccess('Товар обновлен!');
                    setModalProduct(null);
                    axios.get('/api/products').then(res => setProducts(res.data));
                  } catch (error) {
                    showError('Ошибка обновления товара');
                  }
                }}>
                  <div className="mb-3">
                    <label className="form-label">Название</label>
                    <input type="text" className="form-control" value={modalProduct.name} onChange={e => setModalProduct(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Цена</label>
                    <input type="number" className="form-control" value={modalProduct.price} onChange={e => setModalProduct(p => ({ ...p, price: e.target.value }))} min={1} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Категория</label>
                    <select className="form-control" value={modalProduct.category} onChange={e => setModalProduct(p => ({ ...p, category: e.target.value }))} required>
                      <option value="">Выберите категорию</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">В наличии</label>
                    <input type="number" className="form-control" value={modalProduct.stock} onChange={e => setModalProduct(p => ({ ...p, stock: e.target.value }))} min={0} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Цвет</label>
                    <input type="text" className="form-control" value={modalProduct.color} onChange={e => setModalProduct(p => ({ ...p, color: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Описание</label>
                    <textarea className="form-control" value={modalProduct.description} onChange={e => setModalProduct(p => ({ ...p, description: e.target.value }))} rows={3} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Характеристики</label>
                    {(modalProduct.characteristics || []).map((char, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <input type="text" className="form-control" placeholder="Название" value={char.key} onChange={e => setModalProduct(p => ({ ...p, characteristics: p.characteristics.map((c, idx) => idx === i ? { ...c, key: e.target.value } : c) }))} style={{ maxWidth: 180 }} />
                        <input type="text" className="form-control" placeholder="Значение" value={char.value} onChange={e => setModalProduct(p => ({ ...p, characteristics: p.characteristics.map((c, idx) => idx === i ? { ...c, value: e.target.value } : c) }))} style={{ maxWidth: 220 }} />
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setModalProduct(p => ({ ...p, characteristics: p.characteristics.filter((_, idx) => idx !== i) }))} disabled={modalProduct.characteristics.length === 1}>×</button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={() => setModalProduct(p => ({ ...p, characteristics: [...(p.characteristics || []), { key: '', value: '' }] }))}>+ Добавить характеристику</button>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Дополнительные услуги</label>
                    {(modalProduct.options || []).map((srv, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <input type="text" className="form-control" placeholder="Название услуги" value={srv.name} onChange={e => setModalProduct(p => ({ ...p, options: p.options.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s) }))} style={{ maxWidth: 180 }} />
                        <input type="number" className="form-control" placeholder="Цена" value={srv.price} onChange={e => setModalProduct(p => ({ ...p, options: p.options.map((s, idx) => idx === i ? { ...s, price: e.target.value } : s) }))} style={{ maxWidth: 120 }} />
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setModalProduct(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))} disabled={modalProduct.options.length === 1}>×</button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={() => setModalProduct(p => ({ ...p, options: [...(p.options || []), { name: '', price: '' }] }))}>+ Добавить услугу</button>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Медиа (фото и видео)</label>
                    <Uploader
                      endpoint={`/api/admin/products/${modalProduct._id}/media`}
                      initialMedia={[
                        ...(modalProduct.images || []).map(url => ({ url, type: 'image' })),
                        ...(modalProduct.videos || []).map(url => ({ url, type: 'video' }))
                      ]}
                      onUploadComplete={(media) => {
                        const images = media.filter(m => m.type === 'image').map(m => m.url);
                        const videos = media.filter(m => m.type === 'video').map(m => m.url);
                        setModalProduct(p => ({ ...p, images, videos }));
                        setProducts(ps => ps.map(pr => pr._id === modalProduct._id ? { ...pr, images, videos } : pr));
                        // drag&drop порядок — отправляем на сервер
                        axios.put(`/api/admin/products/${modalProduct._id}/media-order`, { images, videos });
                      }}
                    />
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-primary flex-grow-1">Сохранить</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setModalProduct(null)}>Закрыть</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
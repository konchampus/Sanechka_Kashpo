import { useState, useEffect, useRef } from 'react';
import axios from '../../lib/axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Admin.module.css';
import { FaTrashAlt, FaPlus, FaSpinner, FaBroom, FaImage } from 'react-icons/fa';
import Uploader from '../../components/Uploader';
import BannerSlider from '../../components/BannerSlider';
import { getImageUrl } from '../../lib/utils';
import BackButton from '../../components/BackButton';
import Cookies from 'js-cookie';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [formData, setFormData] = useState({ title: '', image: null, video: null });
  const [modalBanner, setModalBanner] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    // Проверка роли на клиенте
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
        return;
      }
    }
    axios.get('/api/banners').then(res => setBanners(res.data));
  }, []);

  const handleClearForm = () => {
    setFormData({ title: '', image: null, video: null });
  };

  const validate = () => {
    if (!formData.title.trim()) {
      toast.error('Введите заголовок баннера!');
      return false;
    }
    if (!formData.image && !formData.video) {
      toast.error('Добавьте изображение или видео для баннера!');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsUploading(true);
    try {
      await axios.post('/api/admin/banners', {
        title: formData.title,
        image: formData.image,
        video: formData.video
      });
      toast.success('Баннер добавлен!');
      handleClearForm();
      axios.get('/api/banners').then(res => setBanners(res.data));
    } catch (error) {
      toast.error('Ошибка добавления баннера');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить баннер?')) return;
    try {
      await axios.delete(`/api/admin/banners/${id}`);
      toast.success('Баннер удалён!');
      setBanners(banners.filter(b => b._id !== id));
    } catch (error) {
      toast.error('Ошибка удаления баннера');
    }
  };

  return (
    <div className="container my-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.adminContainer}
      >
        <BackButton />
        <h1 className="text-center mb-5">Управление баннерами</h1>
        <form onSubmit={handleSubmit} style={{ marginBottom: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 24 }} autoComplete="off">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="bannerTitle">Заголовок баннера</label>
              <input
                id="bannerTitle"
                type="text"
                className="form-control"
                placeholder="Весна 2024"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                maxLength={64}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="bannerMedia"><FaImage style={{ marginRight: 6, color: '#7A5C3A' }} />Изображение или видео</label>
              <Uploader
                endpoint="/api/admin/upload-media"
                multiple={false}
                onUploadComplete={(media) => {
                  const file = media[0];
                  if (file.type === 'video') {
                    setFormData(prev => ({ ...prev, video: file.url, image: null }));
                  } else {
                    setFormData(prev => ({ ...prev, image: file.url, video: null }));
                  }
                }}
              />
            </div>
            <div className="col-12 d-flex gap-2 mt-2">
              <button type="submit" className="btn btn-primary flex-grow-1" disabled={isUploading} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                {isUploading ? <FaSpinner className="fa-spin" /> : <FaPlus />} {isUploading ? 'Загрузка...' : 'Добавить'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClearForm} disabled={isUploading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaBroom /> Очистить
              </button>
            </div>
          </div>
        </form>
        <div className={styles.adminContainer}>
          <h2 className="mt-5">Предпросмотр</h2>
          <div style={{ background: '#faf7f3', borderRadius: 12, padding: 12, marginBottom: 32 }}>
            <BannerSlider banners={banners} />
          </div>
          
          <h2 className="mt-5">Список баннеров</h2>
          <div className="row g-4">
            {banners.map(banner => (
              <div key={banner._id} className="col-md-4">
                <div className="card" style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)' }}>
                  <div style={{ height: 180, background: '#eee', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                    {banner.video ? (
                      <video src={getImageUrl(banner.video)} className="card-img-top unifiedImage" style={{ height: '100%', objectFit: 'cover' }} autoPlay muted loop playsInline />
                    ) : (
                      <img src={getImageUrl(banner.image)} alt={banner.title} className="card-img-top unifiedImage" style={{ height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: 'var(--accent-brown)' }}>{banner.title}</h5>
                    <button
                      className="btn btn-danger"
                      style={{ background: 'var(--accent-brown)', border: 'none', borderRadius: 8, boxShadow: '0 2px 8px rgba(122,92,58,0.10)', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => handleDelete(banner._id)}
                    ><FaTrashAlt /> Удалить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
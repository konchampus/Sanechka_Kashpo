import { useState, useEffect, useRef } from 'react';
import axios from '../../lib/axios';
import { showSuccess, showError } from '../../lib/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Admin.module.css';
import { FaPlus, FaTrashAlt, FaSpinner, FaBroom, FaImage } from 'react-icons/fa';
import { getImageUrl } from '../../lib/utils';
import Uploader from '../../components/Uploader';
import Cookies from 'js-cookie';

export default function AdminPhotos() {
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({ name: '', media: [] });
  const [modalPhoto, setModalPhoto] = useState(null);

  useEffect(() => {
    // Проверка роли на клиенте
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
        return;
      }
    }
    axios.get('/api/photos').then(res => setPhotos(res.data));
  }, []);

  const handleClearForm = () => {
    setFormData({ name: '', media: [] });
  };

  const validate = () => {
    if (!formData.name.trim()) {
      showError('Введите название!');
      return false;
    }
    if (formData.media.length === 0) {
      showError('Добавьте хотя бы один файл!');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Загрузка уже произошла в Uploader, здесь мы просто сохраняем
    try {
      await axios.post('/api/photos', { 
        name: formData.name,
        urls: formData.media.map(m => m.url)
      });
      showSuccess('Фотографии успешно добавлены!');
      handleClearForm();
      axios.get('/api/photos').then(res => setPhotos(res.data));
    } catch (error) {
      showError('Ошибка сохранения фотографий');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить фото?')) return;
    try {
      await axios.delete(`/api/photos/${id}`);
      showSuccess('Фото успешно удалено!');
      setPhotos(photos.filter(p => p._id !== id));
    } catch (error) {
      showError('Ошибка удаления фото');
    }
  };

  return (
    <div className="container my-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-center mb-5">Управление галереей</h1>
        <form onSubmit={handleSubmit} style={{ marginBottom: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', padding: 24 }} autoComplete="off">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label" htmlFor="photoName">Название/описание</label>
              <input
                id="photoName"
                type="text"
                className="form-control"
                placeholder="Например, 'Новая коллекция кашпо'"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="photoFile"><FaImage style={{ marginRight: 6, color: '#7A5C3A' }} />Файлы (фото или видео)</label>
              <Uploader
                endpoint="/api/admin/upload-media"
                initialMedia={formData.media}
                onUploadComplete={(media) => setFormData(prev => ({ ...prev, media }))}
              />
            </div>
            <div className="col-12 d-flex gap-2 mt-2">
              <button type="submit" className="btn btn-primary flex-grow-1" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <FaPlus /> Добавить в галерею
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClearForm} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaBroom /> Очистить
              </button>
            </div>
          </div>
        </form>
        <div className={styles.adminContainer}>
          <h2 className="mt-5">Список фотографий</h2>
          <div className="row g-4">
            {photos.map(photo => (
              <div key={photo._id} className="col-md-4">
                <div className="card" style={{ cursor: 'pointer', borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)' }} onClick={() => setModalPhoto(photo)}>
                  {photo.url.includes('.mp4') || photo.url.includes('.webm') || photo.url.includes('.mov') ? (
                    <video src={getImageUrl(photo.url)} style={{ height: 180, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} autoPlay muted loop playsInline />
                  ) : (
                    <img src={getImageUrl(photo.url)} alt={photo.name} className="card-img-top" style={{ height: 180, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
                  )}
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: 'var(--accent-brown)' }}>{photo.name}</h5>
                    <button
                      className="btn btn-danger"
                      style={{ background: 'var(--accent-brown)', border: 'none', borderRadius: 8, boxShadow: '0 2px 8px rgba(122,92,58,0.10)', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={e => { e.stopPropagation(); handleDelete(photo._id); }}
                    ><FaTrashAlt /> Удалить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {modalPhoto && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalPhoto(null)}
            >
              <motion.div
                className={styles.modalContent}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ borderRadius: 18, background: '#fff', boxShadow: '0 8px 32px rgba(122,92,58,0.18)' }}
              >
                {modalPhoto.url.includes('.mp4') || modalPhoto.url.includes('.webm') || modalPhoto.url.includes('.mov') ? (
                  <video src={getImageUrl(modalPhoto.url)} style={{ width: '100%', maxHeight: 400, borderRadius: 16, background: '#000' }} controls autoPlay playsInline />
                ) : (
                  <img src={getImageUrl(modalPhoto.url)} alt={modalPhoto.name} style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 16, background: '#faf7f3' }} />
                )}
                <h4 className="mt-3" style={{ color: 'var(--accent-brown)' }}>{modalPhoto.name}</h4>
                <button className="btn btn-secondary mt-3" style={{ borderRadius: 8, background: 'var(--accent-brown)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setModalPhoto(null)}>Закрыть</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
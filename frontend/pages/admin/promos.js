import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Admin.module.css';
import { FaTag, FaPercent, FaTrashAlt, FaPlus, FaBroom, FaEye } from 'react-icons/fa';
import Cookies from 'js-cookie';

export default function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    minOrder: '',
    usageLimit: ''
  });
  const [filterCode, setFilterCode] = useState('');
  const [modalPromo, setModalPromo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Проверка роли на клиенте
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
        return;
      }
    }
    fetchPromos();
  }, []);

  const fetchPromos = () => {
    axios.get('/api/promos').then(res => setPromos(res.data));
  };

  const validate = () => {
    if (!formData.code.trim()) {
      toast.error('Введите код промокода!');
      return false;
    }
    if (!/^[A-Za-z0-9-_]+$/.test(formData.code)) {
      toast.error('Код может содержать только латиницу, цифры, - и _');
      return false;
    }
    if (!formData.discount || isNaN(formData.discount) || formData.discount < 1 || formData.discount > 99) {
      toast.error('Скидка должна быть от 1 до 99%');
      return false;
    }
    if (formData.minOrder === '' || isNaN(formData.minOrder) || formData.minOrder < 0) {
      toast.error('Минимальная сумма должна быть не меньше 0');
      return false;
    }
    if (!formData.usageLimit || isNaN(formData.usageLimit) || formData.usageLimit < 1) {
      toast.error('Лимит использований должен быть не меньше 1');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await axios.post('/api/promos', {
        code: formData.code.trim(),
        discount: Number(formData.discount),
        minOrder: Number(formData.minOrder),
        usageLimit: Number(formData.usageLimit)
      });
      toast.success('Промокод добавлен!');
      setFormData({ code: '', discount: '', minOrder: '', usageLimit: '' });
      fetchPromos();
    } catch (error) {
      toast.error('Ошибка добавления промокода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить промокод?')) return;
    try {
      await axios.delete(`/api/promos/${id}`);
      toast.success('Промокод удалён!');
      setPromos(promos.filter(p => p._id !== id));
    } catch (error) {
      toast.error('Ошибка удаления промокода');
    }
  };

  const handleClearForm = () => {
    setFormData({ code: '', discount: '', minOrder: '', usageLimit: '' });
  };

  const filteredPromos = promos.filter(promo =>
    !filterCode || promo.code.toLowerCase().includes(filterCode.toLowerCase())
  );

  return (
    <div className="container my-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.adminContainer}
      >
        <h1 className="text-center mb-5">Управление промокодами</h1>
        {/* Форма добавления */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 32 }} autoComplete="off">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label" htmlFor="code"><FaTag style={{ marginRight: 6, color: '#7A5C3A' }} />Код</label>
              <input
                id="code"
                type="text"
                className="form-control"
                placeholder="SPRING2024"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={32}
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" htmlFor="discount"><FaPercent style={{ marginRight: 6, color: '#4A7043' }} />Скидка (%)</label>
              <input
                id="discount"
                type="number"
                className="form-control"
                placeholder="10"
                value={formData.discount}
                onChange={e => setFormData({ ...formData, discount: e.target.value })}
                min={1}
                max={99}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="minOrder">Мин. сумма заказа</label>
              <input
                id="minOrder"
                type="number"
                className="form-control"
                placeholder="2000"
                value={formData.minOrder}
                onChange={e => setFormData({ ...formData, minOrder: e.target.value })}
                min={0}
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" htmlFor="usageLimit">Лимит</label>
              <input
                id="usageLimit"
                type="number"
                className="form-control"
                placeholder="50"
                value={formData.usageLimit}
                onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                min={1}
                required
              />
            </div>
            <div className="col-md-2 d-flex align-items-end gap-2">
              <button type="submit" className="btn btn-primary flex-grow-1" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <FaPlus /> {isLoading ? 'Добавление...' : 'Добавить'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClearForm} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaBroom /> Очистить
              </button>
            </div>
          </div>
        </form>
        {/* Фильтры */}
        <div className="row mb-4 g-2 align-items-end">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Поиск по коду..."
              value={filterCode}
              onChange={e => setFilterCode(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <button className="btn btn-secondary w-100" onClick={() => setFilterCode('')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaBroom /> Сбросить фильтр</button>
          </div>
        </div>
        {/* Таблица промокодов */}
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Код</th>
                <th>Скидка</th>
                <th>Мин. сумма</th>
                <th>Лимит</th>
                <th>Использовано</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromos.map(promo => (
                <tr key={promo._id} style={{ cursor: 'pointer' }} onClick={() => setModalPromo(promo)}>
                  <td style={{ fontWeight: 600, color: '#7A5C3A', letterSpacing: 1 }}><FaTag style={{ marginRight: 6, color: '#7A5C3A' }} />{promo.code}</td>
                  <td>{promo.discount}%</td>
                  <td>{promo.minOrder} руб.</td>
                  <td>{promo.usageLimit}</td>
                  <td>{promo.used}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ background: 'var(--accent-brown)', border: 'none', borderRadius: 8, boxShadow: '0 2px 8px rgba(122,92,58,0.10)', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={e => { e.stopPropagation(); handleDelete(promo._id); }}
                    ><FaTrashAlt /> Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Модальное окно предпросмотра промокода */}
        <AnimatePresence>
          {modalPromo && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalPromo(null)}
            >
              <motion.div
                className={styles.modalContent}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ borderRadius: 18, background: '#fff', boxShadow: '0 8px 32px rgba(122,92,58,0.18)' }}
              >
                <h4 style={{ color: 'var(--accent-brown)' }}><FaTag style={{ marginRight: 8 }} />Промокод: {modalPromo.code}</h4>
                <p><b>Скидка:</b> {modalPromo.discount}%</p>
                <p><b>Мин. сумма заказа:</b> {modalPromo.minOrder} руб.</p>
                <p><b>Лимит использований:</b> {modalPromo.usageLimit}</p>
                <p><b>Использовано:</b> {modalPromo.used}</p>
                <button className="btn btn-secondary mt-3" style={{ borderRadius: 8, background: 'var(--accent-brown)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setModalPromo(null)}>Закрыть</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
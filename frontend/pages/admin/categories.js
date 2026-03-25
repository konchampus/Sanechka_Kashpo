import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Admin.module.css';
import { FaPlus, FaTrashAlt, FaEdit, FaBroom, FaSpinner, FaTag, FaGripVertical, FaSave, FaTimes } from 'react-icons/fa';
import Cookies from 'js-cookie';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', editing: null });
  const [isLoading, setIsLoading] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  useEffect(() => {
    // Проверка роли на клиенте
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
        return;
      }
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get('/api/categories');
    setCategories(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsLoading(true);
    try {
      // Новый способ: создаём категорию напрямую
      await axios.post('/api/admin/categories', { name: form.name });
      setForm({ name: '', editing: null });
      fetchCategories();
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm('Удалить категорию?')) return;
    // Удаление категории: удаляем все товары с этой категорией (MVP)
    setIsLoading(true);
    try {
      const res = await axios.get('/api/products?category=' + encodeURIComponent(cat.name));
      for (const p of res.data) {
        await axios.delete('/api/admin/products/' + p._id);
      }
      fetchCategories();
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, editing: cat });
  };

  const handleSaveEdit = async () => {
    if (!form.name.trim() || !form.editing) return;
    setIsLoading(true);
    try {
      // Переименовываем категорию у всех товаров
      const res = await axios.get('/api/products?category=' + encodeURIComponent(form.editing.name));
      for (const p of res.data) {
        await axios.put('/api/admin/products/' + p._id, { ...p, category: form.name });
      }
      setForm({ name: '', editing: null });
      fetchCategories();
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (idx) => setDraggedIdx(idx);
  const handleDrop = (idx) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const arr = [...categories];
    const [item] = arr.splice(draggedIdx, 1);
    arr.splice(idx, 0, item);
    setCategories(arr);
    setDraggedIdx(null);
    // TODO: отправить новый порядок на сервер, если появится поддержка
  };

  return (
    <div className="container my-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.adminContainer}
      >
        <h1 className="text-center mb-5">Управление категориями</h1>
        <form onSubmit={form.editing ? e => { e.preventDefault(); handleSaveEdit(); } : handleSubmit} style={{ marginBottom: 32 }} autoComplete="off">
          <div className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="form-label" htmlFor="catName"><FaTag style={{ marginRight: 6, color: '#7A5C3A' }} />{form.editing ? 'Переименовать категорию' : 'Новая категория'}</label>
              <input
                id="catName"
                type="text"
                className="form-control"
                placeholder="Название категории"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                maxLength={32}
                required
                autoFocus
              />
            </div>
            <div className="col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-primary flex-grow-1" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                {isLoading ? <FaSpinner className="fa-spin" /> : form.editing ? <FaSave /> : <FaPlus />} {isLoading ? 'Сохранение...' : form.editing ? 'Сохранить' : 'Добавить'}
              </button>
              {form.editing && (
                <button type="button" className="btn btn-secondary" onClick={() => setForm({ name: '', editing: null })} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaTimes /> Отмена
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setForm({ name: '', editing: null })} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaBroom /> Очистить
              </button>
            </div>
          </div>
        </form>
        <h2 className="mt-5">Список категорий</h2>
        <div className="row g-3">
          {categories.map((cat, idx) => (
            <div key={cat._id} className="col-md-4">
              <div className="card text-center" style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(122,92,58,0.10)', cursor: 'grab', background: draggedIdx === idx ? '#faf7f3' : '#fff' }}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
              >
                <div className="card-body d-flex flex-column align-items-center justify-content-center">
                  <FaGripVertical style={{ color: '#A68A64', marginBottom: 8, fontSize: 22, opacity: 0.7 }} />
                  <h5 className="card-title" style={{ color: 'var(--accent-brown)' }}>{cat.name}</h5>
                  <div className="d-flex gap-2 mt-2 justify-content-center">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(cat)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaEdit /> Редактировать</button>
                    <button className="btn btn-danger btn-sm" style={{ background: 'var(--accent-brown)', border: 'none', borderRadius: 8, boxShadow: '0 2px 8px rgba(122,92,58,0.10)' }} onClick={() => handleDelete(cat)}><FaTrashAlt /> Удалить</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 
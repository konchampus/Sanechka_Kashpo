import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { motion } from 'framer-motion';
import styles from '../../styles/Admin.module.css';
import { FaUser, FaEnvelope, FaTrashAlt, FaUserShield, FaUserAlt, FaBroom, FaSearch } from 'react-icons/fa';
import { showSuccess, showError } from '../../lib/notifications';
import BackButton from '../../components/BackButton';
import Cookies from 'js-cookie';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users' + (search ? `?search=${encodeURIComponent(search)}` : ''));
      setUsers(res.data);
    } catch (e) {
      showError('Ошибка загрузки пользователей');
    }
    setLoading(false);
  };

  useEffect(() => {
    // Проверка роли на клиенте
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
        return;
      }
    }
    fetchUsers();
  }, [search]);

  const handleRoleChange = async (id, role) => {
    setUpdatingId(id);
    try {
      await axios.put(`/api/admin/users/${id}`, { role });
      showSuccess('Роль обновлена');
      fetchUsers();
    } catch (e) {
      showError('Ошибка смены роли');
    }
    setUpdatingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    setUpdatingId(id);
    try {
      await axios.delete(`/api/admin/users/${id}`);
      showSuccess('Пользователь удалён');
      fetchUsers();
    } catch (e) {
      showError('Ошибка удаления пользователя');
    }
    setUpdatingId(null);
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
        <h1 className="text-center mb-5">Пользователи</h1>
        <div className="row mb-4 g-2 align-items-end">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text"><FaSearch /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Поиск по email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <button className="btn btn-secondary w-100" onClick={() => setSearch('')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaBroom /> Сбросить</button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th><FaUser /> Имя</th>
                <th><FaEnvelope /> Email</th>
                <th>Роль</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#a68a64' }}>Загрузка...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#a68a64' }}>Пользователи не найдены</td></tr>
              ) : users.map(user => (
                <tr key={user._id}>
                  <td>{user.name || ''} {user.surname || ''}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="form-control"
                      value={user.role}
                      disabled={updatingId === user._id}
                      onChange={e => handleRoleChange(user._id, e.target.value)}
                      style={{ borderRadius: 8, background: '#faf7f3', color: user.role === 'admin' ? '#4A7043' : '#7A5C3A', fontWeight: 600 }}
                    >
                      <option value="user">Пользователь</option>
                      <option value="admin">Админ</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ background: 'var(--accent-brown)', border: 'none', borderRadius: 8, boxShadow: '0 2px 8px rgba(122,92,58,0.10)', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => handleDelete(user._id)}
                      disabled={updatingId === user._id}
                    ><FaTrashAlt /> Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
} 
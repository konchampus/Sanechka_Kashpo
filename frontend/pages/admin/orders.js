import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Admin.module.css';
import { FaEye, FaBroom, FaFilter, FaSearch, FaFileExport } from 'react-icons/fa';
import BackButton from '../../components/BackButton';
import Cookies from 'js-cookie';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [modalOrder, setModalOrder] = useState(null);

  useEffect(() => {
    // Проверка роли на клиенте
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
        return;
      }
    }
    axios.get('/api/admin/orders').then(res => setOrders(res.data));
  }, []);

  // Экспорт в CSV
  const handleExport = () => {
    const rows = [
      ['Номер заказа', 'Клиент', 'Телефон', 'Email', 'Сумма', 'Статус', 'Дата', 'Адрес', 'Товары'],
      ...filteredOrders.map(order => [
        order.orderNumber,
        order.guestData?.name || '',
        order.guestData?.phone || '',
        order.guestData?.email || '',
        order.totalPrice,
        order.status,
        order.createdAt?.slice(0, 10),
        order.address || '',
        (order.cart || []).map(i => `${i.name} x${i.quantity}`).join('; ')
      ])
    ];
    const csv = rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`/api/admin/orders/${id}`, { status });
      toast.success('Статус обновлен!');
      setOrders(orders.map(order => order._id === id ? { ...order, status } : order));
    } catch (error) {
      toast.error('Ошибка обновления статуса');
    }
  };

  // Фильтрация заказов
  const filteredOrders = orders.filter(order =>
    (!filterStatus || order.status === filterStatus) &&
    (!filterDate || order.createdAt?.slice(0, 10) === filterDate) &&
    (!search ||
      (order.orderNumber && order.orderNumber.toString().includes(search)) ||
      (order.guestData?.name && order.guestData.name.toLowerCase().includes(search.toLowerCase())) ||
      (order.guestData?.surname && order.guestData.surname.toLowerCase().includes(search.toLowerCase())) ||
      (order.guestData?.phone && order.guestData.phone.includes(search)) ||
      (order.guestData?.email && order.guestData.email.toLowerCase().includes(search.toLowerCase()))
    )
  );

  // Цвета статусов
  const statusColors = {
    pending: '#f7b731',
    shipped: '#4b7bec',
    delivered: '#20bf6b',
    cancelled: '#eb3b5a'
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
        <h1 className="text-center mb-5">Управление заказами</h1>
        {/* Фильтры и поиск */}
        <div className="row mb-4 g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label" htmlFor="statusFilter"><FaFilter style={{ marginRight: 6, color: '#7A5C3A' }} />Статус заказа</label>
            <select id="statusFilter" className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Все статусы</option>
              <option value="pending">В обработке</option>
              <option value="shipped">Отправлен</option>
              <option value="delivered">Доставлен</option>
              <option value="cancelled">Отменен</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="dateFilter">Дата заказа</label>
            <input id="dateFilter" type="date" className="form-control" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="searchOrder"><FaSearch style={{ marginRight: 6, color: '#7A5C3A' }} />Поиск</label>
            <input id="searchOrder" type="text" className="form-control" placeholder="№ заказа, имя, телефон, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="col-md-2 d-flex gap-2 align-items-end">
            <button className="btn btn-secondary w-100" onClick={() => { setFilterStatus(''); setFilterDate(''); setSearch(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaBroom /> Сбросить</button>
            <button className="btn btn-primary w-100" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6 }} type="button"><FaFileExport /> Экспорт</button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Номер заказа</th>
                <th>Клиент</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order._id} style={{ cursor: 'pointer' }} onClick={() => setModalOrder(order)}>
                  <td>{order.orderNumber}</td>
                  <td>
                    {order.userId ? `ID: ${order.userId}` : `${order.guestData?.name || ''} ${order.guestData?.surname || ''}`}
                  </td>
                  <td>{order.totalPrice} руб.</td>
                  <td>
                    <span style={{ background: statusColors[order.status], color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 500, fontSize: 15, letterSpacing: 0.5 }}>
                      {order.status === 'pending' && 'В обработке'}
                      {order.status === 'shipped' && 'Отправлен'}
                      {order.status === 'delivered' && 'Доставлен'}
                      {order.status === 'cancelled' && 'Отменен'}
                    </span>
                  </td>
                  <td>{order.createdAt?.slice(0, 10)}</td>
                  <td>
                    <select
                      className="form-control"
                      style={{ borderRadius: 8, background: '#faf7f3', color: 'var(--accent-brown)', fontWeight: 600 }}
                      value={order.status}
                      onChange={e => { e.stopPropagation(); handleStatusUpdate(order._id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                    >
                      <option value="pending">В обработке</option>
                      <option value="shipped">Отправлен</option>
                      <option value="delivered">Доставлен</option>
                      <option value="cancelled">Отменен</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Модальное окно предпросмотра заказа */}
        <AnimatePresence>
          {modalOrder && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOrder(null)}
            >
              <motion.div
                className={styles.modalContent}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ borderRadius: 18, background: '#fff', boxShadow: '0 8px 32px rgba(122,92,58,0.18)' }}
              >
                <h3 style={{ color: 'var(--accent-brown)' }}>Заказ №{modalOrder.orderNumber}</h3>
                <div style={{ marginBottom: 12 }}>
                  <b>Клиент:</b> {modalOrder.userId ? `ID: ${modalOrder.userId}` : `${modalOrder.guestData?.name || ''} ${modalOrder.guestData?.surname || ''}`}
                  {modalOrder.guestData?.phone && (
                    <><br/><b>Телефон:</b> <a href={`tel:${modalOrder.guestData.phone}`}>{modalOrder.guestData.phone}</a></>)
                  }
                  {modalOrder.guestData?.email && (
                    <><br/><b>Email:</b> <a href={`mailto:${modalOrder.guestData.email}`}>{modalOrder.guestData.email}</a></>)
                  }
                </div>
                <div style={{ marginBottom: 12 }}>
                  <b>Адрес:</b> {modalOrder.address || modalOrder.guestData?.address || '—'}<br/>
                  <b>Город:</b> {modalOrder.guestData?.city || '—'}<br/>
                  <b>Доставка:</b> {modalOrder.guestData?.deliveryMethod || '—'}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <b>Сумма:</b> {modalOrder.totalPrice} руб.<br/>
                  <b>Статус:</b> <span style={{ background: statusColors[modalOrder.status], color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 500 }}>
                    {modalOrder.status === 'pending' && 'В обработке'}
                    {modalOrder.status === 'shipped' && 'Отправлен'}
                    {modalOrder.status === 'delivered' && 'Доставлен'}
                    {modalOrder.status === 'cancelled' && 'Отменен'}
                  </span><br/>
                  <b>Дата:</b> {modalOrder.createdAt?.slice(0, 10)}
                </div>
                <h5 className="mt-3">Товары:</h5>
                <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                  {(modalOrder.cart || modalOrder.products || []).map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      {item.product?.images?.[0] ? (
                        <a href={`/product/${item.product._id}`} target="_blank" rel="noopener noreferrer">
                          <img src={require('../../lib/utils').getImageUrl(item.product.images[0])} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, background: '#faf7f3' }} />
                        </a>
                      ) : null}
                      <span style={{ fontWeight: 500 }}>
                        {item.product?._id ? (
                          <a href={`/product/${item.product._id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#7A5C3A', textDecoration: 'underline' }}>
                            {item.name || item.product?.name}
                          </a>
                        ) : (
                          item.name || item.product?.name
                        )}
                      </span>
                      <span style={{ color: '#7A5C3A' }}>{item.price} ₽ × {item.quantity} шт.</span>
                    </li>
                  ))}
                </ul>
                {modalOrder.comment && (
                  <div style={{ margin: '12px 0', color: '#4A7043' }}><b>Комментарий:</b> {modalOrder.comment}</div>
                )}
                <button className="btn btn-secondary mt-3" style={{ borderRadius: 8, background: 'var(--accent-brown)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setModalOrder(null)}>Закрыть</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
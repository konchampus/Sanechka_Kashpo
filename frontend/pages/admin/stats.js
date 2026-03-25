import { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import StatsChart from '../../components/StatsChart';
import { motion } from 'framer-motion';
import styles from '../../styles/Admin.module.css';
import Cookies from 'js-cookie';

export default function AdminStats() {
  const [visits, setVisits] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Проверка роли на клиенте
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
        return;
      }
    }
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const [visitsRes, referrersRes] = await Promise.all([
        axios.get('/api/admin/analytics/visits', { params }),
        axios.get('/api/admin/analytics/referrers', { params })
      ]);
      setVisits(visitsRes.data);
      setReferrers(referrersRes.data);
    } catch {}
    setLoading(false);
  };

  const totalVisits = visits.reduce((sum, v) => sum + (v.visits || 0), 0);
  const totalUnique = visits.reduce((sum, v) => sum + (v.uniqueUsers || 0), 0);

  return (
    <div className="container my-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.adminContainer}
      >
        <h1 className="text-center mb-5">Аналитика посещаемости</h1>
        <div className="row mb-4 g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label">С даты</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label">По дату</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="col-md-3">
            <button className="btn btn-secondary w-100" onClick={() => { setStartDate(''); setEndDate(''); }}>Сбросить</button>
          </div>
        </div>
        <div className="mb-4">
          <h4>Посещаемость</h4>
          {loading ? <div>Загрузка...</div> : (
            <StatsChart
              data={visits}
              labels={visits.map(v => v.date)}
              datasets={[
                {
                  label: 'Визиты (все)',
                  data: visits.map(v => v.visits),
                  borderColor: '#4A7043',
                  backgroundColor: 'rgba(74,112,67,0.13)',
                  tension: 0.3
                },
                {
                  label: 'Уникальные пользователи',
                  data: visits.map(v => v.uniqueUsers),
                  borderColor: '#7A5C3A',
                  backgroundColor: 'rgba(122,92,58,0.13)',
                  tension: 0.3
                }
              ]}
              type="line"
              height={320}
            />
          )}
          <div style={{ marginTop: 18, fontSize: 17, color: '#7A5C3A' }}>
            Всего визитов: <b>{totalVisits}</b> &nbsp;|&nbsp; Уникальных: <b>{totalUnique}</b>
          </div>
        </div>
        <div className="mb-4">
          <h4>Источники трафика</h4>
          {loading ? <div>Загрузка...</div> : (
            <StatsChart
              labels={referrers.map(r => r._id || 'Прямой')}
              datasets={[{
                label: 'Переходы',
                data: referrers.map(r => r.count),
                backgroundColor: [
                  '#4A7043', '#7A5C3A', '#E8D9B8', '#A68A64', '#F7B731', '#eb3b5a', '#4b7bec', '#20bf6b'
                ]
              }]}
              type="pie"
              height={260}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
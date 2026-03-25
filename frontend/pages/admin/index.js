import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '../../styles/Admin.module.css';
import Cookies from 'js-cookie';
import { FaBox, FaImage, FaTag, FaClipboardList, FaChartBar, FaSlidersH, FaUserCircle } from 'react-icons/fa';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Проверка роли на клиенте
    if (typeof window !== 'undefined') {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
        return;
      }
    }
  }, [router]);

  return (
    <div className="container my-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.adminContainer}
      >
        <h1 className="text-center mb-5">Панель администратора</h1>
        <div className="row g-4">
          {[
            { href: '/admin/products', title: 'Товары', desc: 'Добавляйте, редактируйте и удаляйте товары.', icon: <FaBox size={38} color="#7A5C3A" style={{ marginBottom: 10 }} /> },
            { href: '/admin/categories', title: 'Категории', desc: 'Создавайте, редактируйте и удаляйте категории.', icon: <FaTag size={38} color="#7A5C3A" style={{ marginBottom: 10 }} /> },
            { href: '/admin/banners', title: 'Баннеры', desc: 'Обновляйте слайдер на главной.', icon: <FaSlidersH size={38} color="#7A5C3A" style={{ marginBottom: 10 }} /> },
            { href: '/admin/photos', title: 'Фото', desc: 'Добавляйте и удаляйте фотографии в галерее.', icon: <FaImage size={38} color="#7A5C3A" style={{ marginBottom: 10 }} /> },
            { href: '/admin/promos', title: 'Промокоды', desc: 'Создавайте и редактируйте промокоды.', icon: <FaTag size={38} color="#7A5C3A" style={{ marginBottom: 10 }} /> },
            { href: '/admin/orders', title: 'Заказы', desc: 'Просматривайте и обновляйте статус заказов.', icon: <FaClipboardList size={38} color="#7A5C3A" style={{ marginBottom: 10 }} /> },
            { href: '/admin/users', title: 'Пользователи', desc: 'Управляйте пользователями, ролями и удалением.', icon: <FaUserCircle size={38} color="#7A5C3A" style={{ marginBottom: 10 }} /> },
            { href: '/admin/stats', title: 'Статистика', desc: 'Анализируйте посещения и пользователей.', icon: <FaChartBar size={38} color="#7A5C3A" style={{ marginBottom: 10 }} /> }
          ].map((item, i) => (
            <div key={i} className="col-md-4">
              <Link href={item.href}>
                <div className={styles.adminDashCard + ' card text-center'}>
                  <div className="card-body">
                    <div>{item.icon}</div>
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text">{item.desc}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
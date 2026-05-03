import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from '../lib/axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Link from 'next/link';
import styles from '../styles/Auth.module.css';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import Cookies from 'js-cookie';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', formData);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        Cookies.set('token', res.data.token);
        Cookies.set('role', res.data.role);
        window.dispatchEvent(new Event('authChange'));
        router.push(res.data.role === 'admin' ? '/admin' : '/account');
      }
    } catch (error) {
      toast.error('Неверный email или пароль');
    }
  };

  return (
    <div className={styles.authPageWrap}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={styles.authContainer}
      >
        <h1 className={styles.authTitle}>Вход</h1>
        <form onSubmit={handleSubmit} className={styles.authForm} autoComplete="off">
          <label className={styles.authLabel} htmlFor="email">Email</label>
          <div className={styles.authField}>
            <FaEnvelope className={styles.authIcon} />
            <input
              id="email"
              type="email"
              className={styles.authInput}
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <label className={styles.authLabel} htmlFor="password">Пароль</label>
          <div className={styles.authField}>
            <FaLock className={styles.authIcon} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={styles.authInput}
              placeholder="Пароль"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button type="button" className={styles.showPasswordBtn} onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button type="submit" className={styles.authBtn + ' ' + styles.authBtnPrimary}>Войти</button>
        </form>
        <p className={styles.authBottomText}>
          Нет аккаунта?{' '}
          <Link href="/register" className={styles.authLink}>Зарегистрируйтесь</Link>
        </p>
      </motion.div>
    </div>
  );
}
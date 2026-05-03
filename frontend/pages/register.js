import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from '../lib/axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Link from 'next/link';
import styles from '../styles/Auth.module.css';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import Cookies from 'js-cookie';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/register', form);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        Cookies.set('token', res.data.token);
        // Берём роль из ответа сервера; 'user' — fallback, если backend не вернёт role
        Cookies.set('role', res.data.role || 'user', { expires: 14 });
        toast.success('Регистрация успешна!');
        window.dispatchEvent(new Event('authChange'));
        router.push('/account');
      }
    } catch (error) {
      toast.error('Ошибка регистрации');
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
        <h1 className={styles.authTitle}>Регистрация</h1>
        <form onSubmit={handleSubmit} className={styles.authForm} autoComplete="off">
          {step === 1 && (
            <>
              <label className={styles.authLabel} htmlFor="email">Email</label>
              <div className={styles.authField}>
                <FaEnvelope className={styles.authIcon} />
                <input
                  type="email"
                  id="email"
                  className={styles.authInput}
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <label className={styles.authLabel} htmlFor="password">Пароль</label>
              <div className={styles.authField}>
                <FaLock className={styles.authIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={styles.authInput}
                  placeholder="Пароль"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" className={styles.showPasswordBtn} onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <button type="button" className={styles.authBtn} onClick={() => setStep(2)}>
                Далее
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <label className={styles.authLabel} htmlFor="name">Имя</label>
              <div className={styles.authField}>
                <FaUser className={styles.authIcon} />
                <input
                  type="text"
                  id="name"
                  className={styles.authInput}
                  placeholder="Имя"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <label className={styles.authLabel} htmlFor="phone">Телефон</label>
              <div className={styles.authField}>
                <FaPhone className={styles.authIcon} />
                <input
                  type="tel"
                  id="phone"
                  className={styles.authInput}
                  placeholder="Телефон"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className={styles.authBtn}>
                Зарегистрироваться
              </button>
              <button type="button" className={styles.authBtnSecondary} onClick={() => setStep(1)}>
                Назад
              </button>
            </>
          )}
        </form>
        <p className={styles.authBottomText}>
          Уже есть аккаунт?{' '}
          <Link href="/login" className={styles.authLink}>Войдите</Link>
        </p>
      </motion.div>
    </div>
  );
}
import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/toast-custom.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AnimatePresence, motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { useEffect } from 'react';
import axios from '../lib/axios';
import { showSuccess, showError, showWarning, showInfo } from '../lib/notifications';
import { useState } from 'react';
import Cookies from 'js-cookie';

let lastVisitSent = 0;

const CustomCloseButton = ({ closeToast }) => (
  <button onClick={closeToast} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'absolute', right: 12, top: 12 }}>
    <FaTimes style={{ color: '#7A5C3A', fontSize: '1.3em', opacity: 0.8 }} />
  </button>
);

// Глобальный set для анти-дублирования toasts
const shownToasts = new Set();
const showToast = (type, message) => {
  if (shownToasts.has(message)) return;
  shownToasts.add(message);
  setTimeout(() => shownToasts.delete(message), 2000);
  
  switch (type) {
    case 'success':
      showSuccess(message);
      break;
    case 'error':
      showError(message);
      break;
    case 'warning':
      showWarning(message);
      break;
    case 'info':
      showInfo(message);
      break;
    default:
      showInfo(message);
  }
};

function GlobalErrorBoundary({ children }) {
  const [error, setError] = useState(null);
  useEffect(() => {
    window.onerror = (msg, url, line, col, err) => {
      console.error('Глобальная ошибка:', msg, url, line, col, err);
      showError('Глобальная ошибка: ' + msg);
      setError(msg?.toString() || 'Неизвестная ошибка');
      return false;
    };
    window.onunhandledrejection = (event) => {
      console.error('Необработанное исключение:', event.reason);
      showError('Необработанная ошибка: ' + (event.reason?.message || event.reason));
      setError(event.reason?.message || event.reason?.toString() || 'Неизвестная ошибка');
    };
    return () => {
      window.onerror = null;
      window.onunhandledrejection = null;
    };
  }, []);
  if (error) {
    return (
      <div style={{ color: '#d9534f', background: '#fff3f3', padding: 24, borderRadius: 12, margin: 32, fontSize: 18, fontWeight: 600 }}>
        <div>Произошла ошибка: {error}</div>
        <button onClick={() => setError(null)} style={{ marginTop: 16, background: '#7A5C3A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600 }}>Сбросить</button>
      </div>
    );
  }
  return children;
}

function MyApp({ Component, pageProps, router }) {
  useEffect(() => {
    // Глобальная защита админки
    if (typeof window !== 'undefined' && router.route.startsWith('/admin')) {
      const role = Cookies.get('role');
      if (role !== 'admin') {
        window.location.href = '/login';
      }
    }
  }, [router.route]);

  useEffect(() => {
    (async () => {
      try {
        const now = Date.now();
        if (now - lastVisitSent < 10 * 60 * 1000) return; // не чаще 1 раза в 10 минут
        lastVisitSent = now;
        let ip = '';
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          ip = (await res.json()).ip;
        } catch {}
        let userId = null;
        if (typeof window !== 'undefined' && localStorage.getItem('token')) {
          try {
            userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;
          } catch {}
        }
        try {
          await axios.post('/api/visits', { userId, ip });
        } catch {}
      } catch {}
    })();
  }, []); // только при первом рендере

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <GlobalErrorBoundary>
          <motion.main
            key={router.route}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="flex-grow-1"
          >
            <Component {...pageProps} />
          </motion.main>
        </GlobalErrorBoundary>
      </AnimatePresence>
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        style={{ zIndex: 9999 }}
        limit={5}
      />
    </>
  );
}

export default MyApp;
export { showToast };
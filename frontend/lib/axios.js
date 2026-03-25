import axios from 'axios';
import Cookies from 'js-cookie';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? 'http://localhost:5000' : 'http://backend:5000')
});

instance.interceptors.request.use(config => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Устанавливаем Content-Type в зависимости от типа данных
  if (config.data instanceof FormData) {
    // Для FormData не устанавливаем Content-Type, позволяем браузеру самому определить
    delete config.headers['Content-Type'];
  } else if (config.data && typeof config.data === 'object') {
    // Для JSON данных устанавливаем application/json
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
});

instance.interceptors.response.use(
  response => response,
  error => {
    // Подробный вывод ошибки в консоль
    console.error('Axios error:', error);
    // Показываем toast с подробной ошибкой
    let message = 'Ошибка запроса';
    if (error.response) {
      message = error.response.data?.error || `Ошибка ${error.response.status}`;
    } else if (error.request) {
      message = 'Нет ответа от сервера';
    } else if (error.message) {
      message = error.message;
    }
    // Импортируем showError динамически, чтобы избежать циклических зависимостей
    import('../lib/notifications').then(mod => {
      if (mod && mod.showError) mod.showError(message);
    });
    
    if (error.code === 'NETWORK_ERROR') {
      console.error('Network error - проверьте, что сервер запущен на http://localhost:5000');
    }
    
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        Cookies.remove('token');
        Cookies.remove('role');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
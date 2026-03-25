import { toast } from 'react-toastify';

// Конфигурация уведомлений
const toastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  style: {
    borderRadius: '12px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: 'none',
    padding: '16px 20px',
  }
};

// Типы уведомлений
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

// Иконки для разных типов
const getIcon = (type) => {
  switch (type) {
    case NotificationType.SUCCESS:
      return '✅';
    case NotificationType.ERROR:
      return '❌';
    case NotificationType.WARNING:
      return '⚠️';
    case NotificationType.INFO:
      return 'ℹ️';
    case NotificationType.LOADING:
      return '⏳';
    default:
      return '💬';
  }
};

// Цвета для разных типов
const getColor = (type) => {
  switch (type) {
    case NotificationType.SUCCESS:
      return '#4A7043';
    case NotificationType.ERROR:
      return '#dc3545';
    case NotificationType.WARNING:
      return '#ffc107';
    case NotificationType.INFO:
      return '#7A5C3A';
    case NotificationType.LOADING:
      return '#6c757d';
    default:
      return '#7A5C3A';
  }
};

// Основная функция показа уведомлений
export const showNotification = (type, message, options = {}) => {
  const icon = getIcon(type);
  const color = getColor(type);
  
  const customStyle = {
    ...toastConfig.style,
    borderLeft: `4px solid ${color}`,
    color: color,
  };

  const toastOptions = {
    ...toastConfig,
    ...options,
    style: customStyle,
    toastId: options.toastId || `${type}-${Date.now()}`,
  };

  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span>{message}</span>
    </div>
  );

  switch (type) {
    case NotificationType.SUCCESS:
      return toast.success(content, toastOptions);
    case NotificationType.ERROR:
      return toast.error(content, toastOptions);
    case NotificationType.WARNING:
      return toast.warning(content, toastOptions);
    case NotificationType.INFO:
      return toast.info(content, toastOptions);
    case NotificationType.LOADING:
      return toast.loading(content, toastOptions);
    default:
      return toast(content, toastOptions);
  }
};

// Специализированные функции
export const showSuccess = (message, options = {}) => {
  return showNotification(NotificationType.SUCCESS, message, options);
};

export const showError = (message, options = {}) => {
  return showNotification(NotificationType.ERROR, message, options);
};

export const showWarning = (message, options = {}) => {
  return showNotification(NotificationType.WARNING, message, options);
};

export const showInfo = (message, options = {}) => {
  return showNotification(NotificationType.INFO, message, options);
};

export const showLoading = (message, options = {}) => {
  return showNotification(NotificationType.LOADING, message, options);
};

// Функция для обновления уведомления загрузки
export const updateNotification = (toastId, type, message) => {
  toast.update(toastId, {
    render: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '18px' }}>{getIcon(type)}</span>
        <span>{message}</span>
      </div>
    ),
    type: type,
    isLoading: false,
    autoClose: 3000,
  });
};

// Функция для показа ошибок API
export const showApiError = (error, defaultMessage = 'Произошла ошибка') => {
  let message = defaultMessage;
  
  if (error.response) {
    // Ошибка от сервера
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        message = data.error || 'Неверный запрос';
        break;
      case 401:
        message = 'Необходимо авторизоваться';
        break;
      case 403:
        message = 'Доступ запрещен';
        break;
      case 404:
        message = 'Ресурс не найден';
        break;
      case 429:
        message = 'Слишком много запросов. Попробуйте позже';
        break;
      case 500:
        message = 'Ошибка сервера';
        break;
      default:
        message = data.error || `Ошибка ${status}`;
    }
  } else if (error.request) {
    // Ошибка сети
    message = 'Ошибка подключения к серверу';
  } else if (error.code === 'NETWORK_ERROR') {
    message = 'Проверьте подключение к интернету';
  } else {
    // Другие ошибки
    message = error.message || defaultMessage;
  }
  
  return showError(message);
};

// Функция для показа уведомлений о действиях
export const showActionNotification = (action, success = true) => {
  const actions = {
    add: { success: 'добавлен', error: 'добавления' },
    delete: { success: 'удален', error: 'удаления' },
    update: { success: 'обновлен', error: 'обновления' },
    save: { success: 'сохранен', error: 'сохранения' },
    upload: { success: 'загружен', error: 'загрузки' },
    send: { success: 'отправлен', error: 'отправки' },
    create: { success: 'создан', error: 'создания' },
    edit: { success: 'изменен', error: 'изменения' },
  };
  
  const actionText = actions[action] || { success: 'выполнен', error: 'выполнения' };
  const message = success ? `Успешно ${actionText.success}` : `Ошибка ${actionText.error}`;
  
  return success ? showSuccess(message) : showError(message);
};

// Функция для показа уведомлений о корзине
export const showCartNotification = (action, productName) => {
  const actions = {
    add: `"${productName}" добавлен в корзину`,
    remove: `"${productName}" удален из корзины`,
    update: `Количество "${productName}" обновлено`,
    clear: 'Корзина очищена',
  };
  
  const message = actions[action] || 'Действие выполнено';
  return showSuccess(message);
};

// Функция для показа уведомлений о заказе
export const showOrderNotification = (action) => {
  const actions = {
    create: 'Заказ успешно оформлен',
    update: 'Заказ обновлен',
    cancel: 'Заказ отменен',
    pay: 'Оплата прошла успешно',
  };
  
  const message = actions[action] || 'Действие выполнено';
  return showSuccess(message);
};

// Функция для показа уведомлений о промокоде
export const showPromoNotification = (action, discount = 0) => {
  const actions = {
    apply: `Промокод применен! Скидка: ${discount}%`,
    invalid: 'Неверный промокод',
    expired: 'Промокод истек',
    limit: 'Лимит промокода исчерпан',
    remove: 'Промокод удален',
  };
  
  const message = actions[action] || 'Действие выполнено';
  const isSuccess = action === 'apply' || action === 'remove';
  
  return isSuccess ? showSuccess(message) : showWarning(message);
};

// Функция для показа уведомлений о файлах
export const showFileNotification = (action, fileName) => {
  const actions = {
    upload: `Файл "${fileName}" загружен`,
    delete: `Файл "${fileName}" удален`,
    error: `Ошибка загрузки файла "${fileName}"`,
    tooLarge: `Файл "${fileName}" слишком большой`,
    invalidType: `Неподдерживаемый тип файла "${fileName}"`,
  };
  
  const message = actions[action] || 'Действие выполнено';
  const isSuccess = action === 'upload' || action === 'delete';
  
  return isSuccess ? showSuccess(message) : showError(message);
};

// Функция для показа уведомлений о форме
export const showFormNotification = (action) => {
  const actions = {
    save: 'Форма сохранена',
    submit: 'Форма отправлена',
    validate: 'Проверьте правильность заполнения полей',
    required: 'Заполните все обязательные поля',
  };
  
  const message = actions[action] || 'Действие выполнено';
  const isSuccess = action === 'save' || action === 'submit';
  
  return isSuccess ? showSuccess(message) : showWarning(message);
};

// Экспорт всех функций
export default {
  showNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  updateNotification,
  showApiError,
  showActionNotification,
  showCartNotification,
  showOrderNotification,
  showPromoNotification,
  showFileNotification,
  showFormNotification,
  NotificationType,
}; 
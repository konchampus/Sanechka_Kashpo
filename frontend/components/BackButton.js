import { useRouter } from 'next/router';
import { FaArrowLeft } from 'react-icons/fa';
import styles from '../styles/Admin.module.css';

export default function BackButton({ to = '/admin', label = 'Назад' }) {
  const router = useRouter();
  return (
    <button
      className={styles.backBtn}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(to);
      }}
      type="button"
    >
      <FaArrowLeft style={{ marginRight: 8 }} /> {label}
    </button>
  );
} 
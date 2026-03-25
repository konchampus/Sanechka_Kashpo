import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../lib/utils';
import axios from '../lib/axios';
import { showSuccess, showError } from '../lib/notifications';
import { FaTimes, FaSpinner, FaPlus, FaVideo } from 'react-icons/fa';
import styles from '../styles/Uploader.module.css';

export default function Uploader({
  initialMedia = [],
  onUploadComplete,
  endpoint,
  multiple = true,
  accept = 'image/*,video/*',
  orderEndpoint // новый проп для отправки порядка
}) {
  const [media, setMedia] = useState(initialMedia.map(m => ({ ...m, progress: 100 })));
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const inputRef = useRef();

  useEffect(() => {
    setMedia(initialMedia.map(m => ({ ...m, progress: 100 })));
  }, [initialMedia]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    uploadFiles(files);
  };

  const uploadFiles = (files) => {
    const newUploads = files.map(file => ({
      file,
      id: `${file.name}-${Date.now()}`,
      progress: 0,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    newUploads.forEach(async (upload) => {
      try {
        const formData = new FormData();
        formData.append('media', upload.file);

        const res = await axios.post(endpoint, formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadingFiles(prev =>
              prev.map(f => f.id === upload.id ? { ...f, progress: percentCompleted } : f)
            );
          },
        });

        if (res.data && res.data.url) {
          const newMedium = { url: res.data.url, type: upload.type, progress: 100 };
          setMedia(prev => {
            const updatedMedia = [...prev, newMedium];
            if (onUploadComplete) onUploadComplete(updatedMedia);
            return updatedMedia;
          });
          showSuccess(`Файл ${upload.file.name} загружен`);
        } else {
          showError(`Ошибка загрузки ${upload.file.name}`);
        }
      } catch (err) {
        showError(`Ошибка загрузки ${upload.file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(f => f.id !== upload.id));
      }
    });
  };

  const handleRemove = async (urlToRemove) => {
    const newMedia = media.filter(m => m.url !== urlToRemove);
    setMedia(newMedia);
    if (onUploadComplete) {
      onUploadComplete(newMedia);
    }
    // TODO: Добавить удаление с сервера, если потребуется
  };

  const handleDragSort = (from, to) => {
    const newMedia = [...media];
    const [moved] = newMedia.splice(from, 1);
    newMedia.splice(to, 0, moved);
    setMedia(newMedia);
    if (onUploadComplete) {
      onUploadComplete(newMedia);
    }
    // Отправка порядка на сервер, если есть orderEndpoint
    if (orderEndpoint) {
      const images = newMedia.filter(m => m.type === 'image').map(m => m.url);
      const videos = newMedia.filter(m => m.type === 'video').map(m => m.url);
      axios.put(orderEndpoint, { images, videos });
    }
  };

  const allMedia = [...media, ...uploadingFiles];
  const totalProgress = uploadingFiles.length > 0
    ? uploadingFiles.reduce((acc, f) => acc + f.progress, 0) / uploadingFiles.length
    : 0;

  return (
    <div className={styles.uploaderContainer}>
      <div
        className={styles.dropZone}
        onDrop={(e) => { e.preventDefault(); uploadFiles(Array.from(e.dataTransfer.files)); }}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {allMedia.map((item, index) => (
          <motion.div
            key={item.id || item.url}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={styles.thumb}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('index', index)}
            onDrop={(e) => handleDragSort(parseInt(e.dataTransfer.getData('index')), index)}
            onDragOver={(e) => e.preventDefault()}
          >
            {item.type === 'video' ? (
              <>
                <FaVideo className={styles.fileTypeIcon} />
                {item.url.startsWith('blob:') 
                  ? <video src={item.url} muted playsInline className={styles.thumbVideo} />
                  : <video src={getImageUrl(item.url)} muted playsInline className={styles.thumbVideo} />
                }
              </>
            ) : (
              <img
                src={item.url.startsWith('blob:') ? item.url : getImageUrl(item.url)}
                alt="preview"
              />
            )}
            <div className={styles.progressBar} style={{ width: `${item.progress}%` }}></div>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => handleRemove(item.url)}
            >
              <FaTimes color="#7A5C3A" size={14} />
            </button>
          </motion.div>
        ))}

        <AnimatePresence>
          {uploadingFiles.length === 0 && (
            <motion.button
              type="button"
              className={styles.addButton}
              onClick={() => inputRef.current.click()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus size={24} />
              <span>Добавить</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {uploadingFiles.length > 0 && (
        <div className={styles.progressContainer}>
          <div className={styles.progressInfo}>
            <span>Загрузка... ({Math.round(totalProgress)}%)</span>
            <FaSpinner className="fa-spin" />
          </div>
          <div className={styles.totalProgressBar}>
            <div className={styles.totalProgressBarInner} style={{ width: `${totalProgress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
} 
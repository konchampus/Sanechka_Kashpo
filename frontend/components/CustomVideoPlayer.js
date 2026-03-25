import { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import styles from '../styles/CustomVideoPlayer.module.css';

export default function CustomVideoPlayer({ src, poster, className }) {
  const playerWrapperRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const handleProgress = () => {
    const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(percent);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const seekTime = (e.target.value / 100) * videoRef.current.duration;
    videoRef.current.currentTime = seekTime;
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(prev => !prev);
  };
  
  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      playerWrapperRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    const playerWrapper = playerWrapperRef.current;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  return (
    <div ref={playerWrapperRef} className={`${styles.playerWrapper} ${className || ''}`} onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={styles.video}
        onTimeUpdate={handleProgress}
        playsInline
      />
      <div className={styles.overlay}>
        {!isPlaying && (
          <button className={styles.playButton} onClick={togglePlay}>
            <FaPlay size={32} />
          </button>
        )}
      </div>
      <div className={styles.controls} onClick={e => e.stopPropagation()}>
        <button onClick={togglePlay} className={styles.controlBtn}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className={styles.progressBar}
        />
        <div className={styles.volumeControl}>
          <button onClick={toggleMute} className={styles.controlBtn}>
            {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className={styles.volumeBar}
          />
        </div>
        <button onClick={toggleFullscreen} className={styles.controlBtn}>
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>
    </div>
  );
} 
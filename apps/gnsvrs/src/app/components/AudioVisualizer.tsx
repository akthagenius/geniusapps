import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AudioVisualizer.css';

interface Track {
  id: number;
  name: string;
  url: string;
  file: File;
  duration: number;
}

export default function AudioVisualizer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isSourceCreatedRef = useRef(false);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const bufferLengthRef = useRef(0);

  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [loopTrack, setLoopTrack] = useState(false);
  const [loopPlaylist, setLoopPlaylist] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [playlistCollapsed, setPlaylistCollapsed] = useState(false);
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);

  const navigate = useNavigate();

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Setup audio context and analyser
  useEffect(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    bufferLengthRef.current = bufferLength;

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      audioContext.close();
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Setup canvas
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = vw;
      canvasRef.current.height = vh;
    }
  }, [vw, vh]);

  // Setup audio source connection
  const setupAudioSource = useCallback(() => {
    const audio = audioRef.current;
    const audioContext = audioContextRef.current;
    const analyser = analyserRef.current;

    if (!audio || !audioContext || !analyser) return;

    if (!isSourceCreatedRef.current && audio.src && audio.src !== '') {
      try {
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        sourceRef.current = source;
        isSourceCreatedRef.current = true;
        console.log('Audio source connected successfully');
      } catch (e) {
        console.error('Error creating audio source:', e);
        try {
          analyser.connect(audioContext.destination);
        } catch (err) {
          console.error('Error connecting analyser:', err);
        }
      }
    }
  }, []);

  // Ensure audio context stays active
  const ensureAudioContextActive = useCallback(() => {
    const audioContext = audioContextRef.current;
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('Audio context resumed');
      }).catch(err => {
        console.error('Error resuming audio context:', err);
      });
    }
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const background = backgroundRef.current;

    if (!audio || !canvas || !ctx || !analyser || !dataArray) return;

    if (!audio.paused && !audio.ended) {
      animationIdRef.current = requestAnimationFrame(animate);

      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, vw, vh);

      const barWidth = (vw / bufferLengthRef.current) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLengthRef.current; i++) {
        const barHeight = dataArray[i];
        const hue = (i / bufferLengthRef.current) * 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x, vh - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      if (vibrationEnabled && background) {
        const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLengthRef.current;
        const maxVibration = 10;
        const intensity = (average / 255) * maxVibration;
        const shakeX = (Math.random() - 0.5) * 2 * intensity;
        const shakeY = (Math.random() - 0.5) * 2 * intensity;
        background.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
      } else if (background && !vibrationEnabled) {
        if (background.style.transform !== 'translate(0px, 0px)') {
          background.style.transform = 'translate(0px, 0px)';
        }
      }
    } else {
      stopAnimation();
    }
  }, [vw, vh, vibrationEnabled]);

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, vw, vh);
    }

    if (backgroundRef.current) {
      backgroundRef.current.style.transform = 'translate(0px, 0px)';
    }
  }, [vw, vh]);

  // Play track from playlist
  const playTrackFromPlaylist = useCallback((index: number) => {
    if (index >= 0 && index < playlist.length) {
      const track = playlist[index];
      const audio = audioRef.current;
      if (!audio) return;

      setCurrentTrackIndex(index);
      stopAnimation();

      audio.pause();
      audio.currentTime = 0;

      if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }

      audio.src = track.url;
      audio.load();

      ensureAudioContextActive();

      const handleLoadedData = () => {
        setupAudioSource();
        audio.play().catch(e => console.log('Auto-play prevented:', e));
        audio.removeEventListener('loadeddata', handleLoadedData);
      };

      audio.addEventListener('loadeddata', handleLoadedData, { once: true });
    }
  }, [playlist, stopAnimation, setupAudioSource, ensureAudioContextActive]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      ensureAudioContextActive();
      setupAudioSource();
      setTimeout(() => {
        if (!animationIdRef.current) {
          animate();
        }
      }, 100);
    };

    const handlePause = () => {
      stopAnimation();
    };

    const handleEnded = () => {
      stopAnimation();

      if (loopTrack && currentTrackIndex >= 0) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Auto-play prevented:', e));
      } else if (loopPlaylist && playlist.length > 0) {
        if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length - 1) {
          playTrackFromPlaylist(currentTrackIndex + 1);
        } else {
          playTrackFromPlaylist(0);
        }
      } else {
        if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length - 1) {
          playTrackFromPlaylist(currentTrackIndex + 1);
        } else {
          setCurrentTrackIndex(-1);
        }
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [loopTrack, loopPlaylist, currentTrackIndex, playlist.length, animate, setupAudioSource, ensureAudioContextActive, stopAnimation, playTrackFromPlaylist]);

  // Add to playlist
  const addToPlaylist = useCallback((file: File, url: string) => {
    const track: Track = {
      id: Date.now() + Math.random(),
      name: file.name,
      url: url,
      file: file,
      duration: 0
    };

    setPlaylist(prev => {
      const newPlaylist = [...prev, track];
      // If no track is playing, play this one
      if (currentTrackIndex === -1 && prev.length === 0) {
        setTimeout(() => {
          playTrackFromPlaylist(newPlaylist.length - 1);
        }, 0);
      }
      return newPlaylist;
    });

    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => {
      setPlaylist(prev => prev.map(t => t.id === track.id ? { ...t, duration: tempAudio.duration } : t));
    });
  }, [currentTrackIndex, playTrackFromPlaylist]);

  // Remove from playlist
  const removeFromPlaylist = useCallback((trackId: number) => {
    setPlaylist(prev => {
      const index = prev.findIndex(t => t.id === trackId);
      if (index === -1) return prev;

      const track = prev[index];
      if (track.url.startsWith('blob:')) {
        URL.revokeObjectURL(track.url);
      }

      const newPlaylist = prev.filter(t => t.id !== trackId);

      if (currentTrackIndex === index) {
        audioRef.current?.pause();
        setCurrentTrackIndex(-1);
        stopAnimation();
      } else if (currentTrackIndex > index) {
        setCurrentTrackIndex(prev => prev - 1);
      }

      return newPlaylist;
    });
  }, [currentTrackIndex, stopAnimation]);

  // Handle audio file upload
  const handleAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      addToPlaylist(file, url);
    }
    e.target.value = '';
  }, [addToPlaylist]);

  // Handle background image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && backgroundRef.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const bgImage = event.target?.result as string;
        if (backgroundRef.current) {
          backgroundRef.current.style.backgroundImage = `url(${bgImage})`;
          backgroundRef.current.style.backgroundSize = 'cover';
          backgroundRef.current.style.backgroundPosition = 'center';
          backgroundRef.current.style.backgroundRepeat = 'no-repeat';
          localStorage.setItem('backgroundImage', bgImage);
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Load saved background image
  useEffect(() => {
    const savedBgImage = localStorage.getItem('backgroundImage');
    if (savedBgImage && backgroundRef.current) {
      backgroundRef.current.style.backgroundImage = `url(${savedBgImage})`;
      backgroundRef.current.style.backgroundSize = 'cover';
      backgroundRef.current.style.backgroundPosition = 'center';
      backgroundRef.current.style.backgroundRepeat = 'no-repeat';
    }
  }, []);

  // Navigation to stores
  const handleMenuClick = useCallback((store: string) => {
    if (store === 'beat') {
      navigate('/beatstore');
    } else if (store === 'merch') {
      console.log('MerchStore coming soon');
    } else if (store === 'art') {
      console.log('ArtStore coming soon');
    }
  }, [navigate]);

  return (
    <div className="audio-visualizer-container">
      {/* Hidden Menu */}
      <div id="top-menu">
        <div className="menu-trigger"></div>
        <div className="menu-content">
          <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); handleMenuClick('beat'); }} data-store="beat">
            BeatStore
          </a>
          <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); handleMenuClick('merch'); }} data-store="merch">
            MerchStore
          </a>
          <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); handleMenuClick('art'); }} data-store="art">
            ArtStore
          </a>
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} id="visualizer-canvas"></canvas>

      {/* Audio Controls */}
      <div id="audio-controls-wrapper">
        <audio ref={audioRef} id="audio-source" controls crossOrigin="anonymous"></audio>
        <button
          id="loop-track-btn"
          className={`loop-btn ${loopTrack ? 'active' : ''}`}
          title="Loop Current Track"
          onClick={() => {
            setLoopTrack(!loopTrack);
            if (!loopTrack) setLoopPlaylist(false);
          }}
        >
          🔁
        </button>
        <button
          id="vibration-toggle-btn"
          className={`loop-btn vibration-btn ${vibrationEnabled ? 'active' : ''}`}
          title="Toggle Background Vibration"
          onClick={() => setVibrationEnabled(!vibrationEnabled)}
        >
          💫
        </button>
      </div>

      {/* Background Container */}
      <div ref={backgroundRef} id="background-container"></div>

      {/* Upload Controls */}
      <div id="upload-controls">
        <div className="upload-group">
          <label htmlFor="audio-upload" className="upload-label">📁 Upload Audio</label>
          <input
            type="file"
            id="audio-upload"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={handleAudioUpload}
          />
        </div>
        <div className="upload-group">
          <label htmlFor="image-upload" className="upload-label">🖼️ Upload Background</label>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>
      </div>

      {/* Playlist Window */}
      <div id="playlist-window" className={playlistCollapsed ? 'collapsed' : ''}>
        <div className="playlist-header">
          <h3>Playlist</h3>
          <div className="playlist-header-buttons">
            <button
              id="loop-playlist-btn"
              className={`loop-btn playlist-loop-btn ${loopPlaylist ? 'active' : ''}`}
              title="Loop Playlist"
              onClick={() => {
                setLoopPlaylist(!loopPlaylist);
                if (!loopPlaylist) setLoopTrack(false);
              }}
            >
              🔁
            </button>
            <button
              id="playlist-toggle"
              className="playlist-toggle-btn"
              onClick={() => setPlaylistCollapsed(!playlistCollapsed)}
            >
              {playlistCollapsed ? '+' : '−'}
            </button>
          </div>
        </div>
        <div className="playlist-content" id="playlist-content">
          {playlist.length === 0 ? (
            <div className="playlist-empty" id="playlist-empty">
              <p>No tracks yet</p>
              <p className="playlist-hint">Upload audio files to add them</p>
            </div>
          ) : (
            <ul className="playlist-list" id="playlist-list">
              {playlist.map((track, index) => {
                const isActive = index === currentTrackIndex;
                const isPlaying = isActive && !audioRef.current?.paused;
                const durationText = track.duration > 0 ? formatTime(track.duration) : '--:--';

                return (
                  <li
                    key={track.id}
                    className={`playlist-item ${isActive ? 'active' : ''} ${isPlaying ? 'playing' : ''}`}
                    onClick={() => playTrackFromPlaylist(index)}
                  >
                    <div className="playlist-item-icon">{isPlaying ? '▶' : '🎵'}</div>
                    <div className="playlist-item-info">
                      <div className="playlist-item-title">{track.name}</div>
                      <div className="playlist-item-duration">{durationText}</div>
                    </div>
                    <button
                      className="playlist-item-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromPlaylist(track.id);
                      }}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


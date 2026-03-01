
import React, { useState, useEffect, useRef } from 'react';
import Typography from '../components/ui/Typography';
import { useApp } from '../contexts/AppContext';

interface DeepFocusProps {
  onExit: () => void;
}

const DeepFocus: React.FC<DeepFocusProps> = ({ onExit }) => {
  const { theme } = useApp();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSetup, setIsSetup] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Приємний звук завершення (Notification chime)
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes > 0) {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (isActive && minutes === 0 && seconds === 0) {
      handleComplete();
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const handleComplete = () => {
    setIsActive(false);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked"));
    }
    if (confirm("Час вийшов! Ви неймовірні. Повернутися до системи?")) {
      onExit();
    }
  };

  const startTimer = (m: number) => {
    setMinutes(m);
    setSeconds(0);
    setIsSetup(false);
    setIsActive(true);
  };

  const formatTime = (m: number, s: number) => {
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isSetup) {
    return (
      <div className="fixed inset-0 z-[200] bg-[var(--bg-main)] flex flex-col items-center justify-center p-8">
        <button onClick={onExit} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 text-[var(--text-main)] flex items-center justify-center">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="text-center space-y-12 max-w-lg w-full">
          <div className="space-y-4">
            <div className="text-[var(--primary)] font-black tracking-widest text-xs uppercase">Налаштування сесії</div>
            <Typography variant="h1" className="text-4xl md:text-5xl">Оберіть час фокусу</Typography>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[5, 15, 25, 45, 60, 90].map((m) => (
              <button
                key={m}
                onClick={() => startTimer(m)}
                className="py-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl text-[var(--text-main)] hover:border-[var(--primary)]/50 group shadow-sm"
              >
                <div className="text-2xl font-black">{m}</div>
                <div className="text-[10px] font-black uppercase opacity-40">хвилин</div>
              </button>
            ))}
          </div>

          <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-widest leading-relaxed">
            Почніть сесію, щоб увійти в стан потоку. <br /> Звук сповістить про завершення.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[var(--bg-main)] flex flex-col items-center justify-center p-8">
      <div className="absolute top-8 right-8 flex gap-4">
        <button
          onClick={() => { setIsActive(false); setIsSetup(true); }}
          className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 text-[var(--text-main)] flex items-center justify-center"
          title="Скинути"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </button>
        <button
          onClick={onExit}
          className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 text-[var(--text-main)] flex items-center justify-center"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="text-center space-y-12 max-w-2xl w-full">
        <div className="space-y-4">
          <div className="text-[var(--primary)] font-black tracking-widest text-xs uppercase">Глибокий фокус активовано</div>
          <h2 className="text-4xl md:text-5xl font-heading font-black text-[var(--text-main)] leading-tight opacity-20">
            ТИША. КОНЦЕНТРАЦІЯ. РЕЗУЛЬТАТ.
          </h2>
        </div>

        {/* Великі фонові цифри */}
        <div className="text-[10rem] md:text-[20rem] font-heading font-black text-[var(--text-main)] opacity-[0.03] leading-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 tabular-nums">
          {formatTime(minutes, seconds)}
        </div>

        {/* Основний таймер */}
        <div className="text-9xl md:text-[12rem] font-heading font-black text-[var(--text-main)] tracking-tighter tabular-nums drop-shadow-sm">
          {formatTime(minutes, seconds)}
        </div>

        <div className="flex justify-center gap-6">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-12 py-5 rounded-3xl font-black text-lg shadow-2xl ${isActive ? 'bg-black/5 text-[var(--text-main)] border border-[var(--border-color)]' : 'bg-[var(--primary)] text-white'
              }`}
          >
            {isActive ? 'ПАУЗА' : 'ПРОДОВЖИТИ'}
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[var(--primary)]' : 'bg-[var(--text-muted)]/20'}`}></div>
          ))}
        </div>
        <div className="text-[var(--text-muted)] text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
          Digital Monastery Mode
        </div>
      </div>
    </div>
  );
};

export default DeepFocus;

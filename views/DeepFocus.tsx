
import React, { useState, useEffect, useRef } from 'react';
import Typography from '../components/ui/Typography';

interface DeepFocusProps {
  onExit: () => void;
}

const DeepFocus: React.FC<DeepFocusProps> = ({ onExit }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSetup, setIsSetup] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Приємний звук завершення (Notification chime)
    audioRef.current = new Audio('https://assets.mixkit.sh/active_storage/sfx/2869/2869-preview.mp3');
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
      <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 transition-all duration-500 animate-in fade-in">
        <button onClick={onExit} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="text-center space-y-12 max-w-lg w-full">
          <div className="space-y-4">
            <div className="text-orange-500 font-black tracking-widest text-xs uppercase">Налаштування сесії</div>
            <Typography variant="h1" className="text-4xl md:text-5xl text-white">Оберіть час фокусу</Typography>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[5, 15, 25, 45, 60, 90].map((m) => (
              <button 
                key={m}
                onClick={() => startTimer(m)}
                className="py-6 bg-white/5 border border-white/10 rounded-3xl text-white hover:bg-white/10 hover:border-orange-500/50 transition-all group"
              >
                <div className="text-2xl font-black group-hover:scale-110 transition-transform">{m}</div>
                <div className="text-[10px] font-black uppercase opacity-40">хвилин</div>
              </button>
            ))}
          </div>

          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest leading-relaxed">
            Почніть сесію, щоб увійти в стан потоку. <br/> Звук сповістить про завершення.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 transition-none animate-in zoom-in-95 duration-500">
      <div className="absolute top-8 right-8 flex gap-4">
        <button 
          onClick={() => { setIsActive(false); setIsSetup(true); }}
          className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
          title="Скинути"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </button>
        <button 
          onClick={onExit}
          className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="text-center space-y-12 max-w-2xl w-full">
        <div className="space-y-4">
          <div className="text-orange-500 font-black tracking-widest text-xs uppercase animate-pulse">Глибокий фокус активовано</div>
          <h2 className="text-4xl md:text-5xl font-heading font-black text-white leading-tight opacity-20">
            ТИША. КОНЦЕНТРАЦІЯ. РЕЗУЛЬТАТ.
          </h2>
        </div>

        {/* Великі фонові цифри */}
        <div className="text-[10rem] md:text-[20rem] font-heading font-black text-white/[0.02] leading-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 tabular-nums">
          {formatTime(minutes, seconds)}
        </div>

        {/* Основний таймер */}
        <div className="text-9xl md:text-[12rem] font-heading font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
          {formatTime(minutes, seconds)}
        </div>

        <div className="flex justify-center gap-6">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-12 py-5 rounded-3xl font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all ${
              isActive ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-slate-950'
            }`}
          >
            {isActive ? 'ПАУЗА' : 'ПРОДОВЖИТИ'}
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-4">
        <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-orange-500 animate-bounce' : 'bg-white/20'}`} style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
        </div>
        <div className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase">
          Digital Monastery Mode
        </div>
      </div>
    </div>
  );
};

export default DeepFocus;

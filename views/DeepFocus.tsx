
import React, { useState, useEffect } from 'react';

interface DeepFocusProps {
  taskTitle: string;
  onExit: () => void;
}

const DeepFocus: React.FC<DeepFocusProps> = ({ taskTitle, onExit }) => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-8 transition-none">
      <div className="absolute top-8 right-8">
        <button 
          onClick={onExit}
          className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="text-center space-y-12 max-w-2xl w-full">
        <div className="space-y-4">
          <div className="text-orange-500 font-black tracking-widest text-xs uppercase">Поточне завдання</div>
          <h2 className="text-4xl md:text-6xl font-heading font-black text-white leading-tight">
            {taskTitle}
          </h2>
        </div>

        <div className="text-[10rem] md:text-[15rem] font-heading font-black text-white/5 leading-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
          {formatTime(seconds)}
        </div>

        <div className="text-8xl md:text-9xl font-heading font-black text-white tracking-tighter tabular-nums">
          {formatTime(seconds)}
        </div>

        <div className="flex justify-center gap-6">
          <button 
            onClick={() => setIsActive(!isActive)}
            className="px-12 py-5 bg-white text-slate-950 rounded-3xl font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            {isActive ? 'ПАУЗА' : 'ПРОДОВЖИТИ'}
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 text-slate-500 text-sm font-medium tracking-widest uppercase">
        <i className="fa-solid fa-mountain-sun mr-3"></i>
        Глибокий фокус активований
      </div>
    </div>
  );
};

export default DeepFocus;

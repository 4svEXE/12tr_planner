
import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import Typography from './Typography';

interface NotificationToastProps {
  task: Task;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ task, onClose }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = task.dueDate! - now;
      
      if (diff <= 0) {
        setTimeLeft('Протерміновано!');
        setIsCritical(true);
        setIsUrgent(true);
      } else {
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(`Залишилось: ${hours}г ${mins}хв`);
        setIsCritical(diff < 3600000); // Less than 1 hour
        setIsUrgent(diff < 900000); // Less than 15 minutes
      }
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [task.dueDate]);

  return (
    <div className={`pointer-events-auto bg-white border-l-4 shadow-2xl rounded-xl p-4 flex gap-4 items-start animate-in slide-in-from-right duration-500 ring-1 ring-black/5 ${isUrgent ? 'border-rose-600 ring-rose-500/20 shadow-rose-200/50' : isCritical ? 'border-amber-400' : 'border-slate-300'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isUrgent ? 'bg-rose-50 text-rose-600 animate-pulse' : isCritical ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
        <i className={`fa-solid ${isUrgent ? 'fa-fire-flame-curved' : isCritical ? 'fa-triangle-exclamation' : 'fa-clock'}`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <Typography variant="tiny" className={`${isUrgent ? 'text-rose-600' : isCritical ? 'text-amber-600' : 'text-slate-400'} font-black mb-1 uppercase tracking-widest flex items-center gap-2`}>
          {timeLeft}
          {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>}
        </Typography>
        <Typography variant="h3" className="text-sm truncate mb-0.5">{task.title}</Typography>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Термін: {new Date(task.dueDate!).toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}</p>
      </div>
      <button onClick={onClose} className="text-slate-300 hover:text-slate-600 p-1 transition-colors">
        <i className="fa-solid fa-xmark text-xs"></i>
      </button>
    </div>
  );
};

export default NotificationToast;

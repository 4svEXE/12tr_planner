
import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import Typography from './Typography';

interface NotificationToastProps {
  task: Task;
  onClose: () => void;
  onTaskClick: (id: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ task, onClose, onTaskClick, onSnooze }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const targetTime = task.scheduledDate || task.dueDate;
      if (!targetTime) return;

      const diff = targetTime - now;

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
  }, [task.scheduledDate, task.dueDate]);

  const handleSnooze = (minutes: number) => {
    onSnooze(task.id, minutes);
    setShowSnoozeMenu(false);
    onClose();
  };

  const snoozeOptions = [
    { label: '5 хв', minutes: 5 },
    { label: '15 хв', minutes: 15 },
    { label: '30 хв', minutes: 30 },
    { label: '1 год', minutes: 60 },
    { label: 'Вечір', minutes: -1 }, // Special case for evening
    { label: 'Завтра', minutes: -2 }, // Special case for tomorrow
  ];

  return (
    <div className={`pointer-events-auto bg-[var(--bg-card)] border-l-4 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom duration-500 ring-1 ring-[var(--border-color)] max-w-sm w-full ${isUrgent ? 'border-rose-600 ring-rose-500/20 shadow-rose-200/50' : isCritical ? 'border-amber-400' : 'border-[var(--primary)]'}`}>
      <div className="flex gap-4 items-start">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isUrgent ? 'bg-rose-50 text-rose-600 animate-pulse' : isCritical ? 'bg-amber-50 text-amber-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
          <i className={`fa-solid ${isUrgent ? 'fa-fire-flame-curved' : isCritical ? 'fa-triangle-exclamation' : 'fa-clock'}`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <Typography variant="tiny" className={`${isUrgent ? 'text-rose-600' : isCritical ? 'text-amber-600' : 'text-[var(--primary)]'} font-black mb-1 uppercase tracking-widest flex items-center gap-2 text-[9px]`}>
            {timeLeft}
            {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>}
          </Typography>
          <Typography
            variant="h3"
            className="text-sm truncate mb-0.5 cursor-pointer hover:text-[var(--primary)] transition-colors text-[var(--text-main)]"
            onClick={() => onTaskClick(task.id)}
          >
            {task.title}
          </Typography>
          <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-tight">
            Термін: {new Date(task.scheduledDate || task.dueDate!).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 transition-colors">
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onTaskClick(task.id)}
          className="flex-1 h-9 bg-[var(--primary)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-md"
        >
          Відкрити
        </button>
        <div className="relative">
          <button
            onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
            className="h-9 px-4 bg-[var(--bg-input)] text-[var(--text-main)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)]/10 transition-all active:scale-95 border border-[var(--border-color)]"
          >
            <i className="fa-solid fa-clock-rotate-left mr-2"></i>
            Відкласти
          </button>

          {showSnoozeMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 min-w-[140px] z-50 animate-in zoom-in-95">
              {snoozeOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleSnooze(option.minutes)}
                  className="w-full text-left px-3 py-2 text-[10px] font-bold text-[var(--text-main)] hover:bg-[var(--primary)]/10 rounded-lg transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;

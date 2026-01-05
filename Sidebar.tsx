import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus } from '../types';
import Typography from './ui/Typography';
// Fix: Added missing Button import to resolve UI compilation error.
import Button from './ui/Button';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { 
    tasks, updateTask, scheduleTask, toggleTaskStatus, 
    isSidebarCollapsed, setSidebarCollapsed, sidebarSettings, updateSidebarSetting,
    aiEnabled, setAiEnabled
  } = useApp();
  
  const [showSettings, setShowSettings] = useState(false);

  const primaryItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', acceptDrop: true },
    { id: 'dashboard', icon: 'fa-house', label: 'Головна' },
    { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні', acceptDrop: true },
    { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні дії', acceptDrop: true },
    { id: 'projects', icon: 'fa-folder-tree', label: 'Проєкти' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки', acceptDrop: true },
  ];

  const widgetItems = [
    { id: 'map', icon: 'fa-map-location-dot', label: 'Карта світу' },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Глибокий фокус' },
    { id: 'finances', icon: 'fa-coins', label: 'Фінанси' },
    { id: 'contacts', icon: 'fa-users-between-lines', label: 'Нетворкінг' },
    { id: 'character', icon: 'fa-user-shield', label: 'Профіль героя' },
  ];

  const bottomItems = [
    { id: 'completed', icon: 'fa-check-double', label: 'Завершено', acceptDrop: true },
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Хештеги' },
    { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', acceptDrop: true },
  ];

  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleGlobalDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    switch (targetId) {
      case 'today':
        scheduleTask(taskId, new Date().setHours(0,0,0,0));
        break;
      case 'inbox':
        updateTask({ ...task, status: TaskStatus.INBOX, scheduledDate: undefined, projectId: undefined, category: 'unsorted', isDeleted: false });
        break;
      case 'next_actions':
        updateTask({ ...task, status: TaskStatus.NEXT_ACTION, isDeleted: false });
        break;
      case 'notes':
        updateTask({ ...task, category: 'note', status: TaskStatus.INBOX, isDeleted: false });
        break;
      case 'completed':
        if (task.status !== TaskStatus.DONE) toggleTaskStatus(task);
        break;
      case 'trash':
        updateTask({ ...task, isDeleted: true });
        break;
    }
  };

  const renderMenuItem = (item: any) => {
    if (sidebarSettings[item.id] === false) return null;
    const isActive = activeTab === item.id;
    
    const handleClick = () => {
      setActiveTab(item.id);
    };

    return (
      <div
        key={item.id}
        onDragOver={(e) => { e.preventDefault(); item.acceptDrop && setDropTargetId(item.id); }}
        onDragLeave={() => setDropTargetId(null)}
        onDrop={(e) => handleGlobalDrop(e, item.id)}
        className={`relative group ${dropTargetId === item.id ? 'scale-105 z-20' : ''}`}
      >
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
            isActive 
              ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-sm font-bold' 
              : dropTargetId === item.id
                ? 'bg-orange-600 text-white shadow-lg ring-4 ring-orange-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span className={`w-5 flex justify-center text-sm ${isActive ? 'text-orange-600' : ''}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </span>
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left font-medium text-[11px] tracking-tight truncate">{item.label}</span>
              {counts[item.id] > 0 && (
                <span className="h-4 min-w-[16px] flex items-center justify-center rounded-full text-[9px] font-bold px-1 bg-slate-100 text-slate-500">
                  {counts[item.id]}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className={`${isSidebarCollapsed ? 'w-16' : 'w-56'} bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out`}>
      <div className="p-4 flex items-center justify-between">
        {!isSidebarCollapsed && (
          <div className="text-xl font-bold font-heading text-orange-600 flex items-center gap-2">
            <i className="fa-solid fa-bolt-lightning text-pink-500 text-base"></i>
            <span>12TR</span>
          </div>
        )}
        <button 
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
        >
          <i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'}`}></i>
        </button>
      </div>
      
      <nav className="flex-1 px-2 space-y-0.5 py-2 overflow-y-auto custom-scrollbar">
        {primaryItems.map(renderMenuItem)}
        <div className="my-4 mx-2 border-t border-slate-100"></div>
        {!isSidebarCollapsed && <div className="px-3 mb-2"><span className="text-[8px] uppercase font-black text-slate-300">Віджети</span></div>}
        {widgetItems.map(renderMenuItem)}
      </nav>

      <div className="px-2 py-4 border-t border-slate-100 space-y-0.5">
        {bottomItems.map(renderMenuItem)}
        <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
          <span className="w-5 flex justify-center text-sm"><i className="fa-solid fa-gear"></i></span>
          {!isSidebarCollapsed && <span className="font-medium text-[11px] tracking-tight">Налаштування</span>}
        </button>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 tiktok-blur">
          <div className="absolute inset-0 bg-slate-900/20" onClick={() => setShowSettings(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative">
            <Typography variant="h2" className="text-xl mb-6">Налаштування</Typography>
            <Button onClick={() => setShowSettings(false)} className="w-full rounded-xl">ЗАКРИТИ</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
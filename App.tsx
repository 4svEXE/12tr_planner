import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Inbox from './views/Inbox';
import Calendar from './views/Calendar';
import Hashtags from './views/Hashtags';
import HobbiesView from './views/HobbiesView';
import ProjectsView from './views/ProjectsView';
import HabitsView from './views/HabitsView';
import DiaryView from './views/DiaryView';
import TrashView from './views/TrashView';
import PeopleView from './views/PeopleView';
import SettingsView from './views/SettingsView';
import ShoppingView from './views/ShoppingView';
import PlannerView from './views/PlannerView';
import StrategyMap from './views/StrategyMap';
import DeepFocus from './views/DeepFocus';
import ListsView from './views/ListsView';
import AiChat from './components/AiChat';
import AuthView from './views/AuthView';
import NotificationToast from './components/ui/NotificationToast';
import DailyReportWizard from './components/DailyReportWizard';
import { TaskStatus, Task } from './types';
const isExe = /12TR-Engine/i.test(navigator.userAgent) || (window as any).process?.versions?.electron;

const WindowTitleBar: React.FC = () => {
  const { theme } = useApp();
  const closeApp = () => (window as any).ipcRenderer?.send('close-window') || window.close();
  const minApp = () => (window as any).ipcRenderer?.send('minimize-window');
  const maxApp = () => (window as any).ipcRenderer?.send('maximize-window');

  if (!isExe) return null;

  return (
    <div className="h-8 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between px-3 select-none z-[1000] shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-[var(--primary)] flex items-center justify-center text-[10px] text-white">
          <i className="fa-solid fa-mountain"></i>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">12TR Engine</span>
      </div>
      <div className="flex items-center h-full no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={minApp} className="h-full px-3 hover:bg-black/5 text-[var(--text-muted)] transition-colors"><i className="fa-solid fa-minus text-[10px]"></i></button>
        <button onClick={maxApp} className="h-full px-3 hover:bg-black/5 text-[var(--text-muted)] transition-colors"><i className="fa-solid fa-square text-[8px]"></i></button>
        <button onClick={closeApp} className="h-full px-3 hover:bg-rose-500 hover:text-white text-[var(--text-muted)] transition-colors"><i className="fa-solid fa-xmark text-[10px]"></i></button>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const {
    activeTab, setActiveTab, tasks, projects, aiEnabled, theme,
    plannerProjectId, setPlannerProjectId, diaryNotificationEnabled,
    diaryNotificationTime, isReportWizardOpen, setIsReportWizardOpen,
    updateTask, scheduleTask
  } = useApp();
  const [showFocusMode, setShowFocusMode] = React.useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [triggeredReminders, setTriggeredReminders] = useState<Set<string>>(new Set());
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [lastDiaryNotifiedDate, setLastDiaryNotifiedDate] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const todayTimestamp = new Date().setHours(0, 0, 0, 0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'classic');
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audioRef.current.volume = 0.4;

    // Handle back button for Mobile/PWA
    const handlePopState = (e: PopStateEvent) => {
      if (activeTab !== 'today') {
        setActiveTab('today');
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [theme, activeTab, setActiveTab]);

  const checkDeadlines = useCallback(() => {
    const now = Date.now();
    const nowDate = new Date();
    const nextTriggered = new Set(triggeredReminders);
    let hasNewTrigger = false;

    if (diaryNotificationEnabled && diaryNotificationTime) {
      const currentTimeStr = nowDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const todayStr = nowDate.toDateString();
      if (currentTimeStr === diaryNotificationTime && lastDiaryNotifiedDate !== todayStr) {
        setLastDiaryNotifiedDate(todayStr);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Час підбити підсумки дня", {
            body: "Заповніть свій щоденник та отримайте XP!",
            icon: "https://api.dicebear.com/7.x/shapes/svg?seed=12TR&backgroundColor=f97316"
          });
        }
        audioRef.current?.play().catch(() => { });
      }
    }

    const activeTasks = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && (t.scheduledDate || t.dueDate));
    activeTasks.forEach(task => {
      const targetTime = task.scheduledDate || task.dueDate || 0;
      if (targetTime < now - 3600000) return;
      if (task.reminders && task.reminders.length > 0) {
        task.reminders.forEach(minutes => {
          const reminderKey = `${task.id}:${minutes}`;
          if (nextTriggered.has(reminderKey)) return;
          const triggerTime = targetTime - (minutes * 60000);
          if (now >= triggerTime && now < targetTime) {
            triggerNotification(task, minutes === 0 ? "Починається зараз!" : `Через ${minutes} хв`);
            nextTriggered.add(reminderKey);
            hasNewTrigger = true;
          }
        });
      }
    });

    if (hasNewTrigger) setTriggeredReminders(nextTriggered);
    const imminent = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.scheduledDate && t.scheduledDate > now && t.scheduledDate <= now + 3600000 && !dismissedAlertIds.has(t.id));
    setActiveAlerts(imminent);
  }, [tasks, triggeredReminders, dismissedAlertIds, diaryNotificationEnabled, diaryNotificationTime, lastDiaryNotifiedDate]);

  const triggerNotification = (task: Task, label: string) => {
    audioRef.current?.play().catch(() => { });
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Квест: ${task.title}`, { body: label, icon: "https://api.dicebear.com/7.x/shapes/svg?seed=12TR&backgroundColor=f97316" });
    }
    setActiveAlerts(prev => prev.find(t => t.id === task.id) ? prev : [...prev, task]);
  };

  useEffect(() => {
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60000);
    return () => clearInterval(interval);
  }, [checkDeadlines]);

  const handleDismissAlert = (taskId: string) => {
    setDismissedAlertIds(prev => new Set(prev).add(taskId));
    setActiveAlerts(prev => prev.filter(t => t.id !== taskId));
  };

  const handleSnooze = (taskId: string, minutes: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newTime: number;
    const now = Date.now();

    if (minutes === -1) {
      // Вечір (21:00 сьогодні або завтра)
      const today = new Date();
      today.setHours(21, 0, 0, 0);
      newTime = today.getTime();
      if (newTime < now) {
        newTime += 24 * 60 * 60 * 1000;
      }
    } else if (minutes === -2) {
      // Завтра о 9:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      newTime = tomorrow.getTime();
    } else {
      // Звичайне відкладання
      newTime = now + (minutes * 60 * 1000);
    }

    updateTask({ ...task, scheduledDate: newTime });
    handleDismissAlert(taskId);
  };

  const counts = React.useMemo(() => ({
    today: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && (t.scheduledDate && new Date(t.scheduledDate).setHours(0, 0, 0, 0) === todayTimestamp)).length,
    inbox: tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX && !t.projectId && !t.scheduledDate).length,
    next_actions: tasks.filter(t => !t.isDeleted && t.status === TaskStatus.NEXT_ACTION).length,
    calendar: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && !!t.scheduledDate).length,
    projects: projects.filter(p => p.type === 'goal' && p.status === 'active').length,
    lists: projects.filter(p => (p.type === 'list' || p.type === 'folder') && p.status === 'active').length,
    trash: tasks.filter(t => t.isDeleted).length
  }), [tasks, projects, todayTimestamp]);

  const renderContent = () => {
    switch (activeTab) {
      case 'today': return <Dashboard />;
      case 'planner': return <PlannerView projectId={plannerProjectId} onExitProjectMode={() => setPlannerProjectId(undefined)} />;
      case 'map': return <StrategyMap />;
      case 'inbox': return <Inbox />;
      case 'next_actions': return <Inbox showNextActions />;
      case 'diary': return <DiaryView />;
      case 'lists': return <ListsView />;
      case 'habits': return <HabitsView />;
      case 'people': return <PeopleView />;
      case 'hobbies': return <HobbiesView />;
      case 'shopping': return <ShoppingView />;
      case 'calendar': return <Calendar />;
      case 'projects': return <ProjectsView />;
      case 'hashtags': return <Hashtags tasks={tasks.filter(t => !t.isDeleted)} />;
      case 'trash': return <TrashView />;
      case 'settings': return <SettingsView />;
      case 'focus': return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-[var(--bg-main)]">
          <div className="w-24 h-24 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center text-4xl mb-6"><i className="fa-solid fa-bullseye"></i></div>
          <h2 className="text-3xl font-black mb-4">Глибокий Фокус</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-xs mb-8 font-medium">Сесія концентрації без відволікань.</p>
          <button onClick={() => setShowFocusMode(true)} className="px-10 py-4 bg-[var(--primary)] text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">УВІЙТИ В ПОТІК</button>
        </div>
      );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-main)]">
      <WindowTitleBar />
      <div className="flex flex-1 text-[var(--text-main)] transition-colors duration-500 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />
        <main className="flex-1 overflow-y-auto relative">
          {renderContent()}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
            {activeAlerts.slice(0, 3).map(task => (
              <NotificationToast
                key={task.id}
                task={task}
                onClose={() => handleDismissAlert(task.id)}
                onTaskClick={(id) => setSelectedTaskId(id)}
                onSnooze={handleSnooze}
              />
            ))}
          </div>
          {showFocusMode && <DeepFocus onExit={() => setShowFocusMode(false)} />}
          {aiEnabled && !isAiOpen && (
            <button onClick={() => setIsAiOpen(true)} className="fixed bottom-[80px] md:bottom-8 right-6 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-[490] hover:scale-110 active:scale-95 transition-all border-4 border-white">
              <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
            </button>
          )}
          {isReportWizardOpen && <DailyReportWizard onClose={() => setIsReportWizardOpen(false)} />}
        </main>
        <AiChat isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, isAuthModalOpen, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#020617]"><i className="fa-solid fa-mountain animate-pulse text-orange-500 text-4xl"></i></div>;
  return (
    <AppProvider userId={user?.uid || 'guest'}>
      <MainLayout />
      {isAuthModalOpen && <AuthView />}
    </AppProvider>
  );
};

export default App;
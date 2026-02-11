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

const MainLayout: React.FC = () => {
  const { 
    activeTab, setActiveTab, tasks, projects, aiEnabled, theme, 
    plannerProjectId, setPlannerProjectId, diaryNotificationEnabled, 
    diaryNotificationTime, isReportWizardOpen, setIsReportWizardOpen 
  } = useApp();
  const [showFocusMode, setShowFocusMode] = React.useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Task[]>([]);
  
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
    audioRef.current = new Audio('https://assets.mixkit.sh/active_storage/sfx/2358/2358-preview.mp3');
    audioRef.current.volume = 0.4;
  }, [theme]);

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
        audioRef.current?.play().catch(() => {});
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
    audioRef.current?.play().catch(() => {});
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

  const counts = React.useMemo(() => ({
    today: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && (t.scheduledDate && new Date(t.scheduledDate).setHours(0,0,0,0) === todayTimestamp)).length,
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
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-500 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />
      <main className="flex-1 overflow-y-auto relative">
        {renderContent()}
        <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
           {activeAlerts.slice(0, 3).map(task => (
             <NotificationToast key={task.id} task={task} onClose={() => handleDismissAlert(task.id)} />
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
  );
};

const App: React.FC = () => {
  const { user, isAuthModalOpen, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950"><i className="fa-solid fa-circle-notch animate-spin text-orange-500 text-2xl"></i></div>;
  return (
    <AppProvider userId={user?.uid || 'guest'}>
      <MainLayout />
      {isAuthModalOpen && <AuthView />}
    </AppProvider>
  );
};

export default App;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import TodayView from './views/TodayView';
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
import DeepFocus from './views/DeepFocus';
import ListsView from './views/ListsView';
import AiChat from './components/AiChat';
import AuthView from './views/AuthView';
import NotificationToast from './components/ui/NotificationToast';
import DailyReportWizard from './components/DailyReportWizard';
import { useNotificationManager } from './hooks/useNotificationManager';
import { TaskStatus, Task } from './types';
const isExe = /12TR-Engine/i.test(navigator.userAgent) || (window as any).process?.versions?.electron;

const WindowTitleBar: React.FC = () => {
  const getNativeWindow = () => {
    try {
      const w = window as any;
      // Many Electron-based apps expose electron or remote
      const electron = w.electron || w.require?.('electron');
      const remote = electron?.remote || w.remote;
      return remote?.getCurrentWindow?.() || w.nativeWindowApi;
    } catch {
      return null;
    }
  };

  const nativeWindow = getNativeWindow();

  const closeApp = () => {
    if (nativeWindow?.close) return nativeWindow.close();
    if ((window as any).ipcRenderer) return (window as any).ipcRenderer.send('close-window');
    window.close();
  };

  const minApp = () => {
    if (nativeWindow?.minimize) return nativeWindow.minimize();
    if ((window as any).ipcRenderer) return (window as any).ipcRenderer.send('minimize-window');
    console.log('Minimize not supported in this environment');
  };

  const maxApp = () => {
    if (nativeWindow?.isMaximized?.()) {
      if (nativeWindow.unmaximize) return nativeWindow.unmaximize();
    } else {
      if (nativeWindow?.maximize) return nativeWindow.maximize();
    }
    if ((window as any).ipcRenderer) return (window as any).ipcRenderer.send('maximize-window');
    console.log('Maximize not supported in this environment');
  };

  // Show only if we are in the EXE
  if (!isExe) return null;

  return (
    <div className="h-8 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between px-3 select-none z-[1000] shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-md bg-[var(--primary)] flex items-center justify-center text-[10px] text-white shadow-lg shadow-[var(--primary)]/20">
          <i className="fa-solid fa-mountain"></i>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] opacity-70">12TR Engine</span>
      </div>
      <div className="flex items-center h-full no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={minApp}
          title="Згорнути"
          className="h-full px-4 hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center"
        >
          <i className="fa-solid fa-minus text-[10px]"></i>
        </button>
        <button
          onClick={maxApp}
          title="Розгорнути"
          className="h-full px-4 hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center"
        >
          <i className="fa-regular fa-square text-[10px]"></i>
        </button>
        <button
          onClick={closeApp}
          title="Закрити"
          className="h-full px-4 hover:bg-rose-500 hover:text-white text-[var(--text-muted)] flex items-center justify-center"
        >
          <i className="fa-solid fa-xmark text-[12px]"></i>
        </button>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const {
    activeTab, setActiveTab, tasks, projects, theme,
    plannerProjectId, setPlannerProjectId, isReportWizardOpen, setIsReportWizardOpen,
  } = useApp();
  const [showFocusMode, setShowFocusMode] = React.useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  // Ref so popstate handler always sees the current tab without stale closure
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const { activeAlerts, handleDismissAlert, handleSnooze } = useNotificationManager();
  const todayTimestamp = new Date().setHours(0, 0, 0, 0);

  // Apply theme whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'midnight');
  }, [theme]);

  // Back-button / PWA navigation — register once on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Push an initial app state so the first back-press doesn't exit
    window.history.replaceState({ tab: 'app' }, '', window.location.href);
    window.history.pushState({ tab: 'app' }, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Let individual views (Shopping details, modal, etc.) handle their own states
      if (e.state?.isDetail || e.state?.isModal) return;

      const current = activeTabRef.current;
      if (current !== 'today') {
        // First back — return to Today
        setActiveTab('today');
        // Re-push so next back press is also intercepted
        window.history.pushState({ tab: 'app' }, '', window.location.href);
      } else {
        // Already on Today — allow native back (exit PWA / go back in browser)
        // Re-push so we always keep at least one state in history
        window.history.pushState({ tab: 'app' }, '', window.location.href);
      }
    };

    const handleOpenAiChat = () => setIsAiOpen(true);
    window.addEventListener('open-ai-chat', handleOpenAiChat);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('open-ai-chat', handleOpenAiChat);
    };
  }, []); // run once on mount only

  const counts = React.useMemo(() => ({
    today: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && (t.scheduledDate && new Date(t.scheduledDate).setHours(0, 0, 0, 0) === todayTimestamp)).length,
    inbox: tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX && !t.projectId && !t.scheduledDate && t.projectSection !== 'habits' && !t.tags.includes('habit')).length,
    next_actions: tasks.filter(t => !t.isDeleted && t.status === TaskStatus.NEXT_ACTION).length,
    calendar: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && !!t.scheduledDate).length,
    projects: projects.filter(p => p.type === 'goal' && p.status === 'active').length,
    lists: projects.filter(p => (p.type === 'list' || p.type === 'folder') && p.status === 'active').length,
    trash: tasks.filter(t => t.isDeleted).length
  }), [tasks, projects, todayTimestamp]);

  const renderContent = () => {
    switch (activeTab) {
      case 'today': return <TodayView />;
      case 'planner': return <PlannerView projectId={plannerProjectId} onExitProjectMode={() => setPlannerProjectId(undefined)} />;
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
          <button onClick={() => setShowFocusMode(true)} className="px-10 py-4 bg-[var(--primary)] text-white rounded-2xl font-black shadow-xl">УВІЙТИ В ПОТІК</button>
        </div>
      );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-main)]">
      <div className="flex flex-1 text-[var(--text-main)] overflow-hidden">
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

          {isReportWizardOpen && <DailyReportWizard onClose={() => setIsReportWizardOpen(false)} />}
        </main>
        <AiChat isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, isAuthModalOpen, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#020617]"><i className="fa-solid fa-mountain text-orange-500 text-4xl"></i></div>;
  return (
    <AppProvider userId={user?.uid || 'guest'}>
      <MainLayout />
      {isAuthModalOpen && <AuthView />}
    </AppProvider>
  );
};

export default App;

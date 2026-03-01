import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Task, Project, Character, Tag, Hobby, TaskStatus, Priority, StoreState, ThemeType, CalendarViewMode, ShoppingStore, ShoppingItem, Interaction, Memory, DiaryEntry, InboxCategory, TimeBlock, RoutinePreset, ReportQuestion, ReportPreset, Person, TwelveWeekYear } from '../types';
import { generateSeedData } from '../services/seedService';
import { db, doc, setDoc, getDoc, onSnapshot } from '../services/firebase';
import { useAuth } from './AuthContext';

const DATA_STORAGE_KEY = '12tr_engine_data_v4';
const UI_PREFS_KEY = '12tr_ui_preferences';

interface AppContextType extends StoreState {
  setActiveTab: (tab: string) => void;
  setTheme: (theme: ThemeType) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  addTask: (title: string, category?: string, projectId?: string, section?: string, isEvent?: boolean, scheduledDate?: number, personId?: string, status?: TaskStatus) => string;
  updateTask: (task: Task) => void;
  toggleTaskStatus: (task: Task) => void;
  deleteTask: (taskId: string, permanent?: boolean) => void;
  restoreTask: (taskId: string) => void;
  reorderTasks: (sourceId: string, targetId: string) => void;
  scheduleTask: (taskId: string, date: number) => void;
  updateProject: (project: Project) => void;
  addProject: (project: any) => string;
  deleteProject: (id: string) => void;
  addProjectSection: (projectId: string, title: string) => void;
  renameProjectSection: (projectId: string, sectionId: string, title: string) => void;
  deleteProjectSection: (projectId: string, sectionId: string) => void;

  toggleHabitStatus: (id: string, date: string, status?: any, note?: string) => void;
  addStore: (n: string) => void;
  updateStore: (s: ShoppingStore) => void;
  deleteStore: (id: string) => void;
  shareStore: (sid: string, email: string) => Promise<void>;
  addShoppingItem: (n: string, sid: string) => void;
  updateShoppingItem: (i: ShoppingItem) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  setCalendarDate: (d: number) => void;
  setCalendarViewMode: (m: CalendarViewMode) => void;
  setDetailsWidth: (w: number) => void;
  addTag: (name: string) => Tag;
  renameTag: (oldName: string, newName: string) => void;
  deleteTag: (name: string) => void;
  addHobby: (name: string) => void;
  renameHobby: (oldName: string, newName: string) => void;
  deleteHobby: (name: string) => void;
  saveDiaryEntry: (date: string, content: string, id?: string) => string;
  deleteDiaryEntry: (id: string) => void;
  addPerson: (person: any) => string;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string, permanent?: boolean) => void;
  restorePerson: (id: string) => void;
  addInteraction: (personId: string, interaction: any) => void;
  deleteInteraction: (personId: string, interactionId: string) => void;
  addRelationshipType: (type: string) => void;
  setAiEnabled: (enabled: boolean) => void;
  updateSidebarSetting: (key: string, value: boolean) => void;
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (block: TimeBlock) => void;
  deleteTimeBlock: (id: string) => void;
  applyRoutinePreset: (presetId: string, dayOfWeek: number) => void;
  saveRoutineAsPreset: (name: string, dayOfWeek: number) => void;
  updateCycle: (updates: Partial<TwelveWeekYear>) => void;
  updateReportTemplate: (template: ReportQuestion[]) => void;
  addReportPreset: (name: string, questions: ReportQuestion[]) => void;
  updateReportPreset: (id: string, updates: Partial<ReportPreset>) => void;
  deleteReportPreset: (id: string) => void;
  setDiaryNotificationEnabled: (enabled: boolean) => void;
  setDiaryNotificationTime: (time: string) => void;
  syncData: () => Promise<void>;
  clearSelectedData: (categories: string[]) => void;
  isSyncing: boolean;
  lastSyncTime: number | null;
  plannerProjectId?: string;
  setPlannerProjectId: (id: string | undefined) => void;
  calendarDate: number;
  calendarViewMode: CalendarViewMode;
  isReportWizardOpen: boolean;
  setIsReportWizardOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Функція для очищення об'єкта від undefined значень (Firebase їх не приймає)
const sanitizeData = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(sanitizeData);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitizeData(v)])
    );
  }
  return obj;
};

const ensureDefaults = (s: any): StoreState => {
  const seed = generateSeedData();
  return {
    ...seed,
    ...s,
    tasks: s?.tasks || [],
    projects: s?.projects || [],
    people: s?.people || [],
    relationshipTypes: s?.relationshipTypes || ['friend', 'colleague', 'family', 'mentor', 'acquaintance'],
    hobbies: s?.hobbies || seed.hobbies,
    diary: s?.diary || [],
    inboxCategories: s?.inboxCategories || seed.inboxCategories,
    timeBlocks: s?.timeBlocks || seed.timeBlocks,
    routinePresets: s?.routinePresets || [],
    reportTemplate: (s?.reportTemplate && s.reportTemplate.length > 0) ? s.reportTemplate : seed.reportTemplate,
    reportPresets: (s?.reportPresets && s.reportPresets.length > 0) ? s.reportPresets : seed.reportPresets,
    shoppingStores: s?.shoppingStores || [],
    shoppingItems: s?.shoppingItems || [],

    character: s?.character || seed.character,
    cycle: s?.cycle || seed.cycle
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({ children }) => {
  const { user } = useAuth();
  const savedUI = JSON.parse(localStorage.getItem(UI_PREFS_KEY) || '{}');

  const [state, setState] = useState<StoreState | null>(null);
  const [activeTab, setActiveTabState] = useState(savedUI.activeTab || 'today');
  const [theme, setThemeState] = useState<ThemeType>(savedUI.theme || 'midnight');
  const [isSidebarCollapsed, setSidebarCollapsedState] = useState(savedUI.isSidebarCollapsed || false);
  const [detailsWidth, setDetailsWidthState] = useState(savedUI.detailsWidth || 450);
  const [calendarDate, setCalendarDate] = useState(Date.now());
  const [calendarViewMode, setCalendarViewModeState] = useState<CalendarViewMode>(savedUI.calendarViewMode || 'month');
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);

  const [plannerProjectId, setPlannerProjectId] = useState<string | undefined>();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      let local = localStorage.getItem(DATA_STORAGE_KEY);
      let data = local ? ensureDefaults(JSON.parse(local)) : ensureDefaults(null);
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) data = ensureDefaults(docSnap.data());
        } catch (e) {
          console.error("Firebase load error", e);
        }
      }
      setState(data);
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!state || !state.updatedAt || isUpdatingFromFirebase.current) return;

    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(state));

    if (user) {
      const cleanData = sanitizeData(state);
      setDoc(doc(db, "users", user.uid), cleanData).catch(err => console.error("Firebase save error", err));
    }
  }, [state, user]);

  const updateUIPreference = (key: string, value: any) => {
    const current = JSON.parse(localStorage.getItem(UI_PREFS_KEY) || '{}');
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify({ ...current, [key]: value }));
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    updateUIPreference('activeTab', tab);
  };

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    updateUIPreference('theme', t);
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    updateUIPreference('isSidebarCollapsed', collapsed);
  };

  const setDetailsWidth = (w: number) => {
    setDetailsWidthState(w);
    updateUIPreference('detailsWidth', w);
  };

  const setCalendarViewMode = (m: CalendarViewMode) => {
    setCalendarViewModeState(m);
    updateUIPreference('calendarViewMode', m);
  };

  const pushUpdate = (updater: (prev: StoreState) => StoreState) => {
    setState(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      return { ...next, updatedAt: Date.now() };
    });
  };

  useEffect(() => {
    if (state && (!state.reportTemplate || state.reportTemplate.length === 0)) {
      const seed = generateSeedData();
      pushUpdate(prev => ({ ...prev, reportTemplate: seed.reportTemplate }));
    }
  }, [state]);

  // Реал-тайм синхронізація з Firebase
  const isUpdatingFromFirebase = useRef(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists() && !isUpdatingFromFirebase.current) {
        const firebaseData = ensureDefaults(docSnap.data());
        // Оновлюємо стан тільки якщо дані з Firebase новіші
        setState(prev => {
          if (!prev || (firebaseData.updatedAt || 0) > (prev.updatedAt || 0)) {
            isUpdatingFromFirebase.current = true;
            setTimeout(() => { isUpdatingFromFirebase.current = false; }, 100);
            return firebaseData;
          }
          return prev;
        });
      }
    }, (error) => {
      console.error("Firebase realtime sync error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Функція для ручної синхронізації
  const syncData = useCallback(async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const firebaseData = ensureDefaults(docSnap.data());
        setState(firebaseData);
        localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(firebaseData));
        setLastSyncTime(Date.now());
      }
    } catch (error) {
      console.error("Manual sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  if (!state) return null;





  return (
    <AppContext.Provider value={{
      ...state, activeTab, setActiveTab, theme, setTheme, isSidebarCollapsed, setSidebarCollapsed, detailsWidth, setDetailsWidth, calendarDate, setCalendarDate, calendarViewMode, setCalendarViewMode,
      plannerProjectId, setPlannerProjectId, isSyncing, lastSyncTime, isReportWizardOpen, setIsReportWizardOpen,
      updateCharacter: (u) => pushUpdate(prev => ({ ...prev, character: { ...prev.character, ...u, updatedAt: Date.now() } })),
      addTask: (title, category = 'tasks', projectId, projectSection, isEvent, scheduledDate, personId, status) => {
        const id = Math.random().toString(36).substr(2, 9);
        const isHabit = projectSection === 'habits';
        const newTask: Task = {
          id, title,
          status: status || (isHabit ? TaskStatus.NEXT_ACTION : TaskStatus.INBOX),
          priority: Priority.NUI,
          difficulty: 1,
          xp: 50,
          tags: isHabit ? ['habit'] : [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          category,
          projectId,
          projectSection: projectSection as any,
          isEvent,
          scheduledDate,
          personId,
          recurrence: isHabit ? 'daily' as any : 'none',
          daysOfWeek: isHabit ? [0, 1, 2, 3, 4, 5, 6] : undefined,
          habitHistory: isHabit ? {} : undefined
        };
        pushUpdate(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
        return id;
      },
      updateTask: (t) => pushUpdate(prev => ({ ...prev, tasks: prev.tasks.map(old => old.id === t.id ? { ...t, updatedAt: Date.now() } : old) })),
      deleteTask: (id, perm) => pushUpdate(prev => ({ ...prev, tasks: perm ? prev.tasks.filter(t => t.id !== id) : prev.tasks.map(t => t.id === id ? { ...t, isDeleted: true, updatedAt: Date.now() } : t) })),
      restoreTask: (id) => pushUpdate(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, isDeleted: false, updatedAt: Date.now() } : t) })),
      reorderTasks: (sId, tId) => pushUpdate(prev => {
        const next = [...prev.tasks];
        const sIdx = next.findIndex(t => t.id === sId);
        const tIdx = next.findIndex(t => t.id === tId);
        if (sIdx >= 0 && tIdx >= 0) {
          const [moved] = next.splice(sIdx, 1);
          next.splice(tIdx, 0, moved);
        }
        return { ...prev, tasks: next };
      }),
      scheduleTask: (id, date) => pushUpdate(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, scheduledDate: date, updatedAt: Date.now() } : t) })),
      toggleTaskStatus: (task) => pushUpdate(prev => {
        const isNowDone = task.status !== TaskStatus.DONE;
        const bonusGold = isNowDone ? (task.priority === Priority.UI ? 50 : 20) : 0;
        const bonusFood = isNowDone ? (Math.random() > 0.5 ? 1 : 0) : 0;
        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === task.id ? { ...t, status: isNowDone ? TaskStatus.DONE : TaskStatus.INBOX, completedAt: isNowDone ? Date.now() : undefined } : t),
          foodInventory: (prev.foodInventory || 0) + bonusFood,
          character: { ...prev.character, gold: prev.character.gold + bonusGold, xp: prev.character.xp + 50, updatedAt: Date.now() }
        };
      }),

      updateProject: (p) => pushUpdate(prev => ({ ...prev, projects: prev.projects.map(old => old.id === p.id ? { ...p, updatedAt: Date.now() } : old) })),
      addProject: (p) => {
        const id = Math.random().toString(36).substr(2, 9);
        pushUpdate(prev => ({ ...prev, projects: [...prev.projects, { ...p, id, progress: 0, status: 'active', updatedAt: Date.now() }] }));
        return id;
      },
      deleteProject: (id) => pushUpdate(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) })),
      addProjectSection: (pId, title) => pushUpdate(prev => ({ ...prev, projects: prev.projects.map(p => p.id === pId ? { ...p, sections: [...(p.sections || []), { id: Math.random().toString(36).substr(2, 5), title }], updatedAt: Date.now() } : p) })),
      renameProjectSection: (pId, sId, title) => pushUpdate(prev => ({ ...prev, projects: prev.projects.map(p => p.id === pId ? { ...p, sections: p.sections?.map(s => s.id === sId ? { ...s, title } : s), updatedAt: Date.now() } : p) })),
      deleteProjectSection: (pId, sId) => pushUpdate(prev => ({ ...prev, projects: prev.projects.map(p => p.id === pId ? { ...p, sections: p.sections?.filter(s => s.id !== sId), updatedAt: Date.now() } : p) })),
      toggleHabitStatus: (id, d, s, note) => pushUpdate(prev => {
        const newStatus = s || 'completed';
        const habit = prev.tasks.find(t => t.id === id);
        const oldStatus = habit?.habitHistory?.[d]?.status || 'none';

        const isNowDone = newStatus === 'completed';
        const wasDone = oldStatus === 'completed';

        let bonusGold = 0;
        let bonusXp = 0;

        if (isNowDone && !wasDone) {
          bonusGold = 10;
          bonusXp = 25;
        } else if (!isNowDone && wasDone) {
          bonusGold = -10;
          bonusXp = -25;
        }

        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === id ? { ...t, habitHistory: { ...(t.habitHistory || {}), [d]: { status: newStatus, note: note !== undefined ? note : (habit?.habitHistory?.[d]?.note) } }, updatedAt: Date.now() } : t),
          character: {
            ...prev.character,
            gold: Math.max(0, prev.character.gold + bonusGold),
            xp: Math.max(0, prev.character.xp + bonusXp),
            updatedAt: Date.now()
          }
        };
      }),
      addStore: (name) => {
        const id = Math.random().toString(36).substr(2, 9);
        pushUpdate(prev => ({ ...prev, shoppingStores: [...(prev.shoppingStores || []), { id, name, icon: 'fa-shop', color: '#6366f1', updatedAt: Date.now(), ownerEmail: user?.email || 'guest' }] }));
      },
      updateStore: (s) => pushUpdate(prev => ({ ...prev, shoppingStores: prev.shoppingStores?.map(old => old.id === s.id ? { ...s, updatedAt: Date.now() } : old) })),
      deleteStore: (id) => pushUpdate(prev => ({ ...prev, shoppingStores: prev.shoppingStores?.filter(s => s.id !== id), shoppingItems: prev.shoppingItems?.filter(i => i.storeId !== id) })),
      shareStore: async (sid, email) => pushUpdate(prev => ({ ...prev, shoppingStores: prev.shoppingStores?.map(s => s.id === sid ? { ...s, collaborators: [...(s.collaborators || []), email], isShared: true, updatedAt: Date.now() } : s) })),
      addShoppingItem: (name, storeId) => {
        const id = Math.random().toString(36).substr(2, 9);
        pushUpdate(prev => ({ ...prev, shoppingItems: [...(prev.shoppingItems || []), { id, name, storeId, isBought: false, updatedAt: Date.now(), lastModifiedBy: user?.email || 'guest' }] }));
      },
      updateShoppingItem: (i) => pushUpdate(prev => ({ ...prev, shoppingItems: prev.shoppingItems?.map(old => old.id === i.id ? { ...i, updatedAt: Date.now() } : old) })),
      toggleShoppingItem: (id) => pushUpdate(prev => ({ ...prev, shoppingItems: prev.shoppingItems?.map(i => i.id === id ? { ...i, isBought: !i.isBought, updatedAt: Date.now(), lastModifiedBy: user?.email || 'guest' } : i) })),
      deleteShoppingItem: (id) => pushUpdate(prev => ({ ...prev, shoppingItems: prev.shoppingItems?.filter(i => i.id !== id) })),
      addTag: (name) => {
        const tag = { id: Math.random().toString(36).substr(2, 9), name, color: '#f97316', updatedAt: Date.now() };
        pushUpdate(prev => ({ ...prev, tags: [...prev.tags, tag] }));
        return tag;
      },
      renameTag: (oldN, newN) => pushUpdate(prev => ({ ...prev, tags: prev.tags.map(t => t.name === oldN ? { ...t, name: newN, updatedAt: Date.now() } : t), tasks: prev.tasks.map(t => ({ ...t, tags: t.tags.map(tag => tag === oldN ? newN : tag) })) })),
      deleteTag: (name) => pushUpdate(prev => ({ ...prev, tags: prev.tags.filter(t => t.name !== name), tasks: prev.tasks.map(t => ({ ...t, tags: t.tags.filter(tag => tag !== name) })) })),
      addHobby: (name) => pushUpdate(prev => ({ ...prev, hobbies: [...(prev.hobbies || []), { id: Math.random().toString(36).substr(2, 9), name, color: '#f97316', updatedAt: Date.now() }] })),
      renameHobby: (oldN, newN) => pushUpdate(prev => ({ ...prev, hobbies: prev.hobbies?.map(h => h.name === oldN ? { ...h, name: newN, updatedAt: Date.now() } : h), people: prev.people?.map(p => ({ ...p, hobbies: p.hobbies.map(h => h === oldN ? newN : h) })) })),
      deleteHobby: (name) => pushUpdate(prev => ({ ...prev, hobbies: prev.hobbies?.filter(h => h.name !== name), people: prev.people?.map(p => ({ ...p, hobbies: p.hobbies.filter(h => h !== name) })) })),
      saveDiaryEntry: (date, content, id) => {
        const finalId = id || Math.random().toString(36).substr(2, 9);
        pushUpdate(prev => {
          const nextD = [...(prev.diary || [])];
          const idx = id ? nextD.findIndex(e => e.id === id) : -1;
          if (idx >= 0) nextD[idx] = { ...nextD[idx], content, updatedAt: Date.now() };
          else nextD.push({ id: finalId, date, content, createdAt: Date.now(), updatedAt: Date.now() });
          return { ...prev, diary: nextD };
        });
        return finalId;
      },
      deleteDiaryEntry: (id) => pushUpdate(prev => ({ ...prev, diary: prev.diary?.filter(e => e.id !== id) })),
      addPerson: (p) => {
        const id = Math.random().toString(36).substr(2, 9);
        pushUpdate(prev => ({ ...prev, people: [...(prev.people || []), { ...p, id, rating: 0, notes: [], memories: [], interactions: [], importantDates: [], hobbies: [], tags: [], socials: {}, loop: 'none', createdAt: Date.now(), updatedAt: Date.now() }] }));
        return id;
      },
      updatePerson: (p) => pushUpdate(prev => ({ ...prev, people: prev.people?.map(old => old.id === p.id ? { ...p, updatedAt: Date.now() } : old) })),
      deletePerson: (id, perm) => pushUpdate(prev => ({ ...prev, people: perm ? prev.people?.filter(p => p.id !== id) : prev.people?.map(p => p.id === id ? { ...p, isDeleted: true, updatedAt: Date.now() } : p) })),
      restorePerson: (id) => pushUpdate(prev => ({ ...prev, people: prev.people?.map(p => p.id === id ? { ...p, isDeleted: false, updatedAt: Date.now() } : p) })),
      addInteraction: (pId, i) => pushUpdate(prev => ({ ...prev, people: prev.people?.map(p => p.id === pId ? { ...p, interactions: [{ ...i, id: Math.random().toString(36).substr(2, 9) }, ...(p.interactions || [])], lastInteractionAt: Date.now(), updatedAt: Date.now() } : p) })),
      deleteInteraction: (pId, iId) => pushUpdate(prev => ({ ...prev, people: prev.people?.map(p => p.id === pId ? { ...p, interactions: p.interactions?.filter(i => i.id !== iId), updatedAt: Date.now() } : p) })),
      addRelationshipType: (t) => pushUpdate(prev => ({ ...prev, relationshipTypes: [...(prev.relationshipTypes || []), t] })),
      setAiEnabled: (e) => pushUpdate(prev => ({ ...prev, aiEnabled: e })),
      updateSidebarSetting: (k, v) => pushUpdate(prev => ({ ...prev, sidebarSettings: { ...(prev.sidebarSettings || {}), [k]: v } })),
      addTimeBlock: (b) => pushUpdate(prev => ({ ...prev, timeBlocks: [...(prev.timeBlocks || []), { ...b, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() }] })),
      updateTimeBlock: (b) => pushUpdate(prev => ({ ...prev, timeBlocks: prev.timeBlocks?.map(old => old.id === b.id ? { ...b, updatedAt: Date.now() } : old) })),
      deleteTimeBlock: (id) => pushUpdate(prev => ({ ...prev, timeBlocks: prev.timeBlocks?.filter(b => b.id !== id) })),
      applyRoutinePreset: (pId, dow) => pushUpdate(prev => {
        const preset = prev.routinePresets?.find(p => p.id === pId);
        if (!preset) return prev;
        const filtered = prev.timeBlocks?.filter(b => b.dayOfWeek !== dow) || [];
        const newBlocks = preset.blocks.map(b => ({ ...b, id: Math.random().toString(36).substr(2, 9), dayOfWeek: dow, updatedAt: Date.now() }));
        return { ...prev, timeBlocks: [...filtered, ...newBlocks] };
      }),
      saveRoutineAsPreset: (n, dow) => pushUpdate(prev => ({ ...prev, routinePresets: [...(prev.routinePresets || []), { id: Math.random().toString(36).substr(2, 9), name: n, blocks: prev.timeBlocks?.filter(b => b.dayOfWeek === dow) || [], updatedAt: Date.now() }] })),
      updateCycle: (u) => pushUpdate(prev => ({ ...prev, cycle: { ...prev.cycle, ...u, updatedAt: Date.now() } })),
      updateReportTemplate: (t) => pushUpdate(prev => ({ ...prev, reportTemplate: t })),
      addReportPreset: (n, qs) => pushUpdate(prev => ({ ...prev, reportPresets: [...(prev.reportPresets || []), { id: Math.random().toString(36).substr(2, 9), name: n, questions: qs, updatedAt: Date.now() }] })),
      updateReportPreset: (id, u) => pushUpdate(prev => ({ ...prev, reportPresets: prev.reportPresets?.map(p => p.id === id ? { ...p, ...u, updatedAt: Date.now() } : p) })),
      deleteReportPreset: (id) => pushUpdate(prev => ({ ...prev, reportPresets: prev.reportPresets?.filter(p => p.id !== id) })),
      setDiaryNotificationEnabled: (e) => pushUpdate(prev => ({ ...prev, diaryNotificationEnabled: e })),
      setDiaryNotificationTime: (t) => pushUpdate(prev => ({ ...prev, diaryNotificationTime: t })),
      clearSelectedData: (categories) => {
        const seed = generateSeedData();
        pushUpdate(prev => {
          let next = { ...prev };
          if (categories.includes('tasks')) next.tasks = [];
          if (categories.includes('projects')) next.projects = seed.projects;
          if (categories.includes('people')) next.people = [];
          if (categories.includes('diary')) next.diary = [];
          if (categories.includes('shopping')) { next.shoppingStores = []; next.shoppingItems = []; }
          if (categories.includes('routine')) { next.timeBlocks = seed.timeBlocks; next.routinePresets = []; }
          if (categories.includes('character')) {
            next.character = seed.character;

          }
          return next;
        });
      },
      syncData,
    } as any}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

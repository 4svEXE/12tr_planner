import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Task, Project, Character, Tag, Hobby, TaskStatus, Priority, StoreState, AquariumObject, ThemeType, CalendarViewMode, ShoppingStore, ShoppingItem, Interaction, Memory, DiaryEntry, InboxCategory, TimeBlock, RoutinePreset, ReportQuestion, ReportPreset, Person, TwelveWeekYear } from '../types';
import { generateSeedData } from '../services/seedService';
import { db, doc, setDoc, getDoc } from '../services/firebase';
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
  buyAquariumObject: (type: 'fish' | 'decor' | 'effect', species: string, cost: number, beauty: number, income: number) => void;
  collectAquariumGold: () => void;
  feedFish: () => void;
  moveAquariumObject: (id: string, x: number, y: number) => void;
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
    reportTemplate: s?.reportTemplate || seed.reportTemplate,
    reportPresets: s?.reportPresets || seed.reportPresets,
    shoppingStores: s?.shoppingStores || [],
    shoppingItems: s?.shoppingItems || [],
    aquariumObjects: s?.aquariumObjects || seed.aquariumObjects,
    lastGoldCollectAt: s?.lastGoldCollectAt || Date.now(),
    lastFedAt: s?.lastFedAt || Date.now(),
    foodInventory: s?.foodInventory || 5,
    aquariumBeauty: s?.aquariumBeauty || 10,
    character: s?.character || seed.character,
    cycle: s?.cycle || seed.cycle
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({ children }) => {
  const { user } = useAuth();
  
  // UI Preferences loading
  const savedUI = JSON.parse(localStorage.getItem(UI_PREFS_KEY) || '{}');

  const [state, setState] = useState<StoreState | null>(null);
  const [activeTab, setActiveTabState] = useState(savedUI.activeTab || 'today');
  const [theme, setThemeState] = useState<ThemeType>(savedUI.theme || 'classic');
  const [isSidebarCollapsed, setSidebarCollapsedState] = useState(savedUI.isSidebarCollapsed || false);
  const [detailsWidth, setDetailsWidthState] = useState(savedUI.detailsWidth || 450);
  const [calendarDate, setCalendarDate] = useState(Date.now());
  const [calendarViewMode, setCalendarViewModeState] = useState<CalendarViewMode>(savedUI.calendarViewMode || 'month');
  const [isReportWizardOpen, setIsReportWizardOpen] = useState(false);
  
  const [plannerProjectId, setPlannerProjectId] = useState<string | undefined>();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Persistence helpers for UI
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

  useEffect(() => {
    const init = async () => {
      let local = localStorage.getItem(DATA_STORAGE_KEY);
      let data = local ? ensureDefaults(JSON.parse(local)) : ensureDefaults(null);
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) data = ensureDefaults(docSnap.data());
      }
      setState(data);
    };
    init();
  }, [user]);

  const pushUpdate = (newState: StoreState) => {
    const final = { ...newState, updatedAt: Date.now() };
    setState(final);
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(final));
    if (user) setDoc(doc(db, "users", user.uid), final);
  };

  if (!state) return null;

  const clearSelectedData = (categories: string[]) => {
    const seed = generateSeedData();
    let nextState = { ...state };

    if (categories.includes('tasks')) nextState.tasks = [];
    if (categories.includes('projects')) nextState.projects = seed.projects;
    if (categories.includes('people')) nextState.people = [];
    if (categories.includes('diary')) nextState.diary = [];
    if (categories.includes('shopping')) {
      nextState.shoppingStores = [];
      nextState.shoppingItems = [];
    }
    if (categories.includes('routine')) {
      nextState.timeBlocks = seed.timeBlocks;
      nextState.routinePresets = [];
    }
    if (categories.includes('character')) {
      nextState.character = seed.character;
      nextState.aquariumObjects = seed.aquariumObjects;
      nextState.lastGoldCollectAt = Date.now();
      nextState.lastFedAt = Date.now();
      nextState.foodInventory = 5;
      nextState.aquariumBeauty = 10;
    }

    pushUpdate(nextState);
  };

  const buyAquariumObject = (type: any, species: string, cost: number, beauty: number, income: number) => {
    if (state.character.gold < cost) return alert("Недостатньо золота!");
    const newObj: AquariumObject = {
      id: Math.random().toString(36).substr(2, 9),
      type, species, beautyPoints: beauty, incomeBonus: income,
      name: species,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      scale: type === 'fish' ? 0.8 + Math.random() * 0.4 : 1,
      flip: Math.random() > 0.5,
      color: type === 'fish' ? ['#f97316', '#0ea5e9', '#ec4899', '#facc15', '#a855f7'][Math.floor(Math.random()*5)] : '#ffffff'
    };
    pushUpdate({
      ...state,
      aquariumObjects: [...(state.aquariumObjects || []), newObj],
      aquariumBeauty: (state.aquariumBeauty || 0) + beauty,
      character: { ...state.character, gold: state.character.gold - cost, updatedAt: Date.now() }
    });
  };

  const feedFish = () => {
    if ((state.foodInventory || 0) <= 0) return alert("Немає корму! Виконуй таски, щоб отримати його.");
    pushUpdate({
      ...state,
      foodInventory: (state.foodInventory || 0) - 1,
      lastFedAt: Date.now(),
      character: { ...state.character, xp: state.character.xp + 20, updatedAt: Date.now() }
    });
  };

  const moveAquariumObject = (id: string, x: number, y: number) => {
    pushUpdate({
      ...state,
      aquariumObjects: state.aquariumObjects?.map(o => o.id === id ? { ...o, x, y } : o)
    });
  };

  const collectAquariumGold = () => {
    const now = Date.now();
    const hours = (now - (state.lastGoldCollectAt || now)) / 3600000;
    if (hours < 1) return;
    
    const fedHours = (now - (state.lastFedAt || now)) / 3600000;
    const efficiency = fedHours > 24 ? 0.1 : 1.0;

    const baseIncome = state.aquariumObjects?.reduce((acc, o) => acc + (o.incomeBonus || 0), 0) || 10;
    const income = Math.floor(hours * baseIncome * efficiency);
    
    pushUpdate({
      ...state,
      lastGoldCollectAt: now,
      character: { ...state.character, gold: state.character.gold + income, updatedAt: now }
    });
  };

  const toggleTaskStatus = (task: Task) => {
    const isNowDone = task.status !== TaskStatus.DONE;
    const bonusGold = isNowDone ? (task.priority === Priority.UI ? 50 : 20) : 0;
    const bonusFood = isNowDone ? (Math.random() > 0.5 ? 1 : 0) : 0;
    
    pushUpdate({
      ...state,
      tasks: state.tasks.map(t => t.id === task.id ? { ...t, status: isNowDone ? TaskStatus.DONE : TaskStatus.INBOX, completedAt: isNowDone ? Date.now() : undefined } : t),
      foodInventory: (state.foodInventory || 0) + bonusFood,
      character: { ...state.character, gold: state.character.gold + bonusGold, xp: state.character.xp + 50, updatedAt: Date.now() }
    });
  };

  const syncData = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = ensureDefaults(docSnap.data());
        setState(data);
        setLastSyncTime(Date.now());
      }
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppContext.Provider value={{
      ...state, activeTab, setActiveTab, theme, setTheme, isSidebarCollapsed, setSidebarCollapsed, detailsWidth, setDetailsWidth, calendarDate, setCalendarDate, calendarViewMode, setCalendarViewMode,
      plannerProjectId, setPlannerProjectId, isSyncing, lastSyncTime, isReportWizardOpen, setIsReportWizardOpen,
      updateCharacter: (u) => pushUpdate({ ...state, character: { ...state.character, ...u, updatedAt: Date.now() } }),
      addTask: (title, category = 'tasks', projectId, projectSection, isEvent, scheduledDate, personId, status) => { 
        const id = Math.random().toString(36).substr(2, 9); 
        const newTask: Task = { 
          id, title, 
          status: status || TaskStatus.INBOX, 
          priority: Priority.NUI, 
          difficulty: 1, 
          xp: 50, 
          tags: [], 
          createdAt: Date.now(), 
          updatedAt: Date.now(), 
          category,
          projectId,
          projectSection: projectSection as any,
          isEvent,
          scheduledDate,
          personId
        };
        pushUpdate({ ...state, tasks: [newTask, ...state.tasks] }); 
        return id; 
      },
      updateTask: (t) => pushUpdate({ ...state, tasks: state.tasks.map(old => old.id === t.id ? { ...t, updatedAt: Date.now() } : old) }),
      deleteTask: (id, perm) => pushUpdate({ ...state, tasks: perm ? state.tasks.filter(t => t.id !== id) : state.tasks.map(t => t.id === id ? { ...t, isDeleted: true, updatedAt: Date.now() } : t) }),
      restoreTask: (id) => pushUpdate({ ...state, tasks: state.tasks.map(t => t.id === id ? { ...t, isDeleted: false, updatedAt: Date.now() } : t) }),
      reorderTasks: (sId, tId) => {
        const next = [...state.tasks];
        const sIdx = next.findIndex(t => t.id === sId);
        const tIdx = next.findIndex(t => t.id === tId);
        if (sIdx >= 0 && tIdx >= 0) {
          const [moved] = next.splice(sIdx, 1);
          next.splice(tIdx, 0, moved);
          pushUpdate({ ...state, tasks: next });
        }
      },
      scheduleTask: (id, date) => pushUpdate({ ...state, tasks: state.tasks.map(t => t.id === id ? { ...t, scheduledDate: date, updatedAt: Date.now() } : t) }),
      toggleTaskStatus,
      buyAquariumObject,
      collectAquariumGold,
      feedFish,
      moveAquariumObject,
      updateProject: (p) => pushUpdate({ ...state, projects: state.projects.map(old => old.id === p.id ? { ...p, updatedAt: Date.now() } : old) }),
      addProject: (p) => { const id = Math.random().toString(36).substr(2, 9); pushUpdate({ ...state, projects: [...state.projects, { ...p, id, progress: 0, status: 'active', updatedAt: Date.now() }] }); return id; },
      deleteProject: (id) => pushUpdate({ ...state, projects: state.projects.filter(p => p.id !== id) }),
      addProjectSection: (pId, title) => pushUpdate({ ...state, projects: state.projects.map(p => p.id === pId ? { ...p, sections: [...(p.sections || []), { id: Math.random().toString(36).substr(2, 5), title }], updatedAt: Date.now() } : p) }),
      renameProjectSection: (pId, sId, title) => pushUpdate({ ...state, projects: state.projects.map(p => p.id === pId ? { ...p, sections: p.sections?.map(s => s.id === sId ? { ...s, title } : s), updatedAt: Date.now() } : p) }),
      deleteProjectSection: (pId, sId) => pushUpdate({ ...state, projects: state.projects.map(p => p.id === pId ? { ...p, sections: p.sections?.filter(s => s.id !== sId), updatedAt: Date.now() } : p) }),
      toggleHabitStatus: (id, d, s, note) => pushUpdate({ ...state, tasks: state.tasks.map(t => t.id === id ? { ...t, habitHistory: { ...(t.habitHistory || {}), [d]: { status: s || 'completed', note } }, updatedAt: Date.now() } : t) }),
      addStore: (name) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newStore: ShoppingStore = { id, name, icon: 'fa-shop', color: '#6366f1', updatedAt: Date.now(), ownerEmail: user?.email || 'guest' };
        pushUpdate({ ...state, shoppingStores: [...(state.shoppingStores || []), newStore] });
      },
      updateStore: (s) => pushUpdate({ ...state, shoppingStores: state.shoppingStores?.map(old => old.id === s.id ? { ...s, updatedAt: Date.now() } : old) }),
      deleteStore: (id) => pushUpdate({ ...state, shoppingStores: state.shoppingStores?.filter(s => s.id !== id), shoppingItems: state.shoppingItems?.filter(i => i.storeId !== id) }),
      shareStore: async (sid, email) => {
        const store = state.shoppingStores?.find(s => s.id === sid);
        if (store) {
          const collaborators = [...(store.collaborators || []), email];
          pushUpdate({ ...state, shoppingStores: state.shoppingStores?.map(s => s.id === sid ? { ...s, collaborators, isShared: true, updatedAt: Date.now() } : s) });
        }
      },
      addShoppingItem: (name, storeId) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newItem: ShoppingItem = { id, name, storeId, isBought: false, updatedAt: Date.now(), lastModifiedBy: user?.email || 'guest' };
        pushUpdate({ ...state, shoppingItems: [...(state.shoppingItems || []), newItem] });
      },
      updateShoppingItem: (i) => pushUpdate({ ...state, shoppingItems: state.shoppingItems?.map(old => old.id === i.id ? { ...i, updatedAt: Date.now() } : old) }),
      toggleShoppingItem: (id) => pushUpdate({ ...state, shoppingItems: state.shoppingItems?.map(i => i.id === id ? { ...i, isBought: !i.isBought, updatedAt: Date.now(), lastModifiedBy: user?.email || 'guest' } : i) }),
      deleteShoppingItem: (id) => pushUpdate({ ...state, shoppingItems: state.shoppingItems?.filter(i => i.id !== id) }),
      addTag: (name) => { const tag = { id: Math.random().toString(36).substr(2, 9), name, color: '#f97316', updatedAt: Date.now() }; pushUpdate({ ...state, tags: [...state.tags, tag] }); return tag; },
      renameTag: (oldN, newN) => pushUpdate({ ...state, tags: state.tags.map(t => t.name === oldN ? { ...t, name: newN, updatedAt: Date.now() } : t), tasks: state.tasks.map(t => ({ ...t, tags: t.tags.map(tag => tag === oldN ? newN : tag) })) }),
      deleteTag: (name) => pushUpdate({ ...state, tags: state.tags.filter(t => t.name !== name), tasks: state.tasks.map(t => ({ ...t, tags: t.tags.filter(tag => tag !== name) })) }),
      addHobby: (name) => pushUpdate({ ...state, hobbies: [...(state.hobbies || []), { id: Math.random().toString(36).substr(2, 9), name, color: '#f97316', updatedAt: Date.now() }] }),
      renameHobby: (oldN, newN) => pushUpdate({ ...state, hobbies: state.hobbies?.map(h => h.name === oldN ? { ...h, name: newN, updatedAt: Date.now() } : h), people: state.people?.map(p => ({ ...p, hobbies: p.hobbies.map(h => h === oldN ? newN : h) })) }),
      deleteHobby: (name) => pushUpdate({ ...state, hobbies: state.hobbies?.filter(h => h.name !== name), people: state.people?.map(p => ({ ...p, hobbies: p.hobbies.filter(h => h !== name) })) }),
      saveDiaryEntry: (date, content, id) => {
        const nextD = [...(state.diary || [])];
        const idx = id ? nextD.findIndex(e => e.id === id) : -1;
        const finalId = id || Math.random().toString(36).substr(2, 9);
        if (idx >= 0) nextD[idx] = { ...nextD[idx], content, updatedAt: Date.now() };
        else nextD.push({ id: finalId, date, content, createdAt: Date.now(), updatedAt: Date.now() });
        pushUpdate({ ...state, diary: nextD });
        return finalId;
      },
      deleteDiaryEntry: (id) => pushUpdate({ ...state, diary: state.diary?.filter(e => e.id !== id) }),
      addPerson: (p) => {
        const id = Math.random().toString(36).substr(2, 9);
        pushUpdate({ ...state, people: [...(state.people || []), { ...p, id, rating: 0, notes: [], memories: [], interactions: [], importantDates: [], hobbies: [], tags: [], socials: {}, loop: 'none', createdAt: Date.now(), updatedAt: Date.now() }] });
        return id;
      },
      updatePerson: (p) => pushUpdate({ ...state, people: state.people?.map(old => old.id === p.id ? { ...p, updatedAt: Date.now() } : old) }),
      deletePerson: (id, perm) => pushUpdate({ ...state, people: perm ? state.people?.filter(p => p.id !== id) : state.people?.map(p => p.id === id ? { ...p, isDeleted: true, updatedAt: Date.now() } : p) }),
      restorePerson: (id) => pushUpdate({ ...state, people: state.people?.map(p => p.id === id ? { ...p, isDeleted: false, updatedAt: Date.now() } : p) }),
      addInteraction: (pId, i) => pushUpdate({ ...state, people: state.people?.map(p => p.id === pId ? { ...p, interactions: [{ ...i, id: Math.random().toString(36).substr(2, 9) }, ...(p.interactions || [])], lastInteractionAt: Date.now(), updatedAt: Date.now() } : p) }),
      deleteInteraction: (pId, iId) => pushUpdate({ ...state, people: state.people?.map(p => p.id === pId ? { ...p, interactions: p.interactions?.filter(i => i.id !== iId), updatedAt: Date.now() } : p) }),
      addRelationshipType: (t) => pushUpdate({ ...state, relationshipTypes: [...(state.relationshipTypes || []), t] }),
      setAiEnabled: (e) => pushUpdate({ ...state, aiEnabled: e }),
      updateSidebarSetting: (k, v) => pushUpdate({ ...state, sidebarSettings: { ...(state.sidebarSettings || {}), [k]: v } }),
      addTimeBlock: (b) => pushUpdate({ ...state, timeBlocks: [...(state.timeBlocks || []), { ...b, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() }] }),
      updateTimeBlock: (b) => pushUpdate({ ...state, timeBlocks: state.timeBlocks?.map(old => old.id === b.id ? { ...b, updatedAt: Date.now() } : old) }),
      deleteTimeBlock: (id) => pushUpdate({ ...state, timeBlocks: state.timeBlocks?.filter(b => b.id !== id) }),
      applyRoutinePreset: (pId, dow) => {
        const preset = state.routinePresets?.find(p => p.id === pId);
        if (preset) {
          const filtered = state.timeBlocks?.filter(b => b.dayOfWeek !== dow) || [];
          const newBlocks = preset.blocks.map(b => ({ ...b, id: Math.random().toString(36).substr(2, 9), dayOfWeek: dow, updatedAt: Date.now() }));
          pushUpdate({ ...state, timeBlocks: [...filtered, ...newBlocks] });
        }
      },
      saveRoutineAsPreset: (n, dow) => {
        const blocks = state.timeBlocks?.filter(b => b.dayOfWeek === dow) || [];
        pushUpdate({ ...state, routinePresets: [...(state.routinePresets || []), { id: Math.random().toString(36).substr(2, 9), name: n, blocks, updatedAt: Date.now() }] });
      },
      updateCycle: (u) => pushUpdate({ ...state, cycle: { ...state.cycle, ...u, updatedAt: Date.now() } }),
      updateReportTemplate: (t) => pushUpdate({ ...state, reportTemplate: t }),
      addReportPreset: (n, qs) => pushUpdate({ ...state, reportPresets: [...(state.reportPresets || []), { id: Math.random().toString(36).substr(2, 9), name: n, questions: qs, updatedAt: Date.now() }] }),
      updateReportPreset: (id, u) => pushUpdate({ ...state, reportPresets: state.reportPresets?.map(p => p.id === id ? { ...p, ...u, updatedAt: Date.now() } : p) }),
      deleteReportPreset: (id) => pushUpdate({ ...state, reportPresets: state.reportPresets?.filter(p => p.id !== id) }),
      setDiaryNotificationEnabled: (e) => pushUpdate({ ...state, diaryNotificationEnabled: e }),
      setDiaryNotificationTime: (t) => pushUpdate({ ...state, diaryNotificationTime: t }),
      clearSelectedData,
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
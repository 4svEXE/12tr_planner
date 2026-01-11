
import { Task, Project, Person, Tag, Hobby, DiaryEntry, ShoppingStore, ShoppingItem, TaskStatus, Priority, TimeBlock } from '../types';

export const generateSeedData = () => {
  const today = new Date().setHours(0, 0, 0, 0);
  const dateStr = new Date().toISOString().split('T')[0];

  // 1. Tags & Hobbies
  const tags: Tag[] = ['робота', 'спорт', 'навчання', 'сім\'я', 'терміново'].map(n => ({
    id: `tag-${Math.random().toString(36).substr(2, 5)}`,
    name: n,
    color: n === 'терміново' ? '#ef4444' : '#f97316'
  }));

  const hobbies: Hobby[] = ['Кіберспорт', 'Фотографія', 'Яхтинг', 'Шахи', 'Йога'].map(n => ({
    id: `hobby-${Math.random().toString(36).substr(2, 5)}`,
    name: n,
    color: '#6366f1'
  }));

  // 2. Projects & Folders
  const insightsFolderId = 'folder_insights';
  const projects: Project[] = [
    { id: insightsFolderId, name: 'Інсайти', color: '#f97316', status: 'active', progress: 0, isStrategic: false, description: 'FOLDER_NOTE' },
    { id: 'goal_1', name: 'Вивчити React Advanced', color: '#6366f1', status: 'active', progress: 30, isStrategic: true, type: 'goal', sphere: 'education' },
    { id: 'goal_2', name: 'Марафон 42км', color: '#ef4444', status: 'active', progress: 10, isStrategic: true, type: 'goal', sphere: 'health' },
    { id: 'sub_1', name: 'Hooks Mastery', color: '#6366f1', parentFolderId: 'goal_1', status: 'active', progress: 50, isStrategic: false, type: 'subproject' },
    { id: 'sub_2', name: 'Купівля екіпірування', color: '#ef4444', parentFolderId: 'goal_2', status: 'active', progress: 0, isStrategic: false, type: 'subproject' }
  ];

  // 3. People (5 allies)
  const people: Person[] = [
    { 
      id: 'p1', name: 'Олена Стратег', status: 'friend', rating: 85, birthDate: '1995-05-12', 
      birthDateShowInCalendar: true, birthDateRepeatYearly: true, tags: ['креатив'], 
      hobbies: ['Йога'], socials: { telegram: 'elena_pro' }, 
      notes: [{ id: 'n1', text: 'Любить лате на вівсяному', date: dateStr }],
      memories: [], interactions: [], 
      importantDates: [{id: 'id1', label: 'День знайомства', date: '2020-09-15', showInCalendar: true, repeatYearly: true}], 
      loop: 'month', createdAt: Date.now() 
    },
    { id: 'p2', name: 'Макс Дев', status: 'colleague', rating: 40, tags: ['техно'], hobbies: ['Шахи'], socials: { linkedin: 'max-dev' }, notes: [], memories: [], interactions: [], importantDates: [], loop: 'week', createdAt: Date.now() },
    { id: 'p3', name: 'Артем Ментор', status: 'mentor', rating: 95, tags: ['бізнес'], hobbies: ['Яхтинг'], socials: {}, notes: [], memories: [], interactions: [], importantDates: [], loop: 'quarter', createdAt: Date.now() },
    { id: 'p4', name: 'Марина Сім\'я', status: 'family', rating: 100, birthDate: '1970-01-01', importantDates: [{id: 'id2', label: 'Річниця', date: '2024-06-20', showInCalendar: true, repeatYearly: true}], loop: 'month', tags: [], hobbies: [], socials: {}, notes: [], memories: [], interactions: [], createdAt: Date.now() },
    { id: 'p5', name: 'Денис Клієнт', status: 'acquaintance', rating: 20, tags: ['продажі'], hobbies: [], socials: {}, notes: [], memories: [], interactions: [], importantDates: [], loop: 'none', createdAt: Date.now() }
  ];

  // 4. TimeBlocks (Розпорядок)
  const timeBlocks: TimeBlock[] = [];
  const days = [0, 1, 2, 3, 4, 5, 6];
  days.forEach(day => {
    timeBlocks.push(
      { id: `tb-${day}-1`, title: 'Ранкова рутина', startHour: 7, endHour: 9, type: 'routine', dayOfWeek: day, color: '#10b981' },
      { id: `tb-${day}-2`, title: 'Глибока робота', startHour: 10, endHour: 13, type: 'work', dayOfWeek: day, color: '#f97316' },
      { id: `tb-${day}-3`, title: 'Обід та відпочинок', startHour: 13, endHour: 14, type: 'rest', dayOfWeek: day, color: '#06b6d4' },
      { id: `tb-${day}-4`, title: 'Навчання/Проєкти', startHour: 15, endHour: 18, type: 'study', dayOfWeek: day, color: '#6366f1' },
      { id: `tb-${day}-5`, title: 'Вечірній огляд', startHour: 21, endHour: 22, type: 'routine', dayOfWeek: day, color: '#ec4899' }
    );
  });

  // 5. Tasks (All types)
  const insightNotes: Task[] = [
    "Дисципліна — це свобода.", "Ваш мозок для ідей, а не для їх зберігання.", 
    "Сьогодні — це все, що у вас є.", "Маленькі кроки ведуть до великих змін.",
    "Фокус — це вміння сказати 'ні' хорошим ідеям."
  ].map((title, i) => ({
    id: `note-ins-${i}`, title, status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 10, tags: ['insight'], createdAt: Date.now(), category: 'note', projectId: insightsFolderId
  }));

  const coreTasks: Task[] = [
    // Завдання в підпроєктах
    { id: 'subt-1', title: 'Вивчити useMemo та useCallback', status: TaskStatus.NEXT_ACTION, priority: Priority.UI, difficulty: 2, xp: 100, tags: ['навчання'], createdAt: Date.now(), projectId: 'sub_1' },
    { id: 'subt-2', title: 'Реалізувати custom hook для API', status: TaskStatus.INBOX, priority: Priority.UNI, difficulty: 3, xp: 150, tags: ['навчання'], createdAt: Date.now(), projectId: 'sub_1' },
    { id: 'subt-3', title: 'Вибрати кросівки для бігу', status: TaskStatus.NEXT_ACTION, priority: Priority.NUI, difficulty: 1, xp: 40, tags: ['спорт'], createdAt: Date.now(), projectId: 'sub_2' },
    { id: 'subt-4', title: 'Замовити спортивний годинник', status: TaskStatus.INBOX, priority: Priority.NUNI, difficulty: 1, xp: 30, tags: ['спорт'], createdAt: Date.now(), projectId: 'sub_2' },

    // Вхідні (5)
    { id: 'in-1', title: 'Купити нову лампу', status: TaskStatus.INBOX, priority: Priority.NUNI, difficulty: 1, xp: 20, tags: [], createdAt: Date.now(), category: 'unsorted' },
    { id: 'in-2', title: 'Подивитись вебінар по GPT-5', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 2, xp: 50, tags: ['навчання'], createdAt: Date.now(), category: 'unsorted' },
    { id: 'in-3', title: 'Ідея: Кава-бот для офісу', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 100, tags: [], createdAt: Date.now(), category: 'unsorted' },
    { id: 'in-4', title: 'Записатись на ТО', status: TaskStatus.INBOX, priority: Priority.UI, difficulty: 1, xp: 30, tags: [], createdAt: Date.now(), category: 'unsorted' },
    { id: 'in-5', title: 'Помити вікна', status: TaskStatus.INBOX, priority: Priority.NUNI, difficulty: 2, xp: 20, tags: [], createdAt: Date.now(), category: 'unsorted' },
    // Наступні дії (5)
    { id: 'nx-1', title: 'Написати вступ до статті', status: TaskStatus.NEXT_ACTION, priority: Priority.UI, difficulty: 2, xp: 60, tags: ['робота'], createdAt: Date.now(), category: 'tasks' },
    { id: 'nx-2', title: 'Відправити інвойс Артему', status: TaskStatus.NEXT_ACTION, priority: Priority.UI, difficulty: 1, xp: 40, tags: ['робота'], createdAt: Date.now(), category: 'tasks', personId: 'p3' },
    { id: 'nx-3', title: 'Забронювати квитки у Львів', status: TaskStatus.NEXT_ACTION, priority: Priority.UNI, difficulty: 1, xp: 30, tags: [], createdAt: Date.now(), category: 'tasks' },
    { id: 'nx-4', title: 'Оновити LinkedIn', status: TaskStatus.NEXT_ACTION, priority: Priority.NUI, difficulty: 2, xp: 120, tags: ['робота'], createdAt: Date.now(), category: 'tasks' },
    { id: 'nx-5', title: 'Підготувати слайди для демо', status: TaskStatus.NEXT_ACTION, priority: Priority.UI, difficulty: 3, xp: 150, tags: ['робота'], createdAt: Date.now(), category: 'tasks' },
    // Календар (5)
    { id: 'cal-1', title: 'Зустріч з командою', status: TaskStatus.INBOX, isEvent: true, scheduledDate: today + (3600000 * 10), priority: Priority.UI, difficulty: 2, xp: 80, tags: ['робота'], createdAt: Date.now() },
    { id: 'cal-2', title: 'Вечеря з Оленою', status: TaskStatus.INBOX, isEvent: true, scheduledDate: today + (3600000 * 19), priority: Priority.NUNI, difficulty: 1, xp: 50, tags: ['сім\'я'], createdAt: Date.now(), personId: 'p1' },
    { id: 'cal-3', title: 'Стоматолог', status: TaskStatus.INBOX, isEvent: true, scheduledDate: today + (86400000 * 2), priority: Priority.UI, difficulty: 2, xp: 100, tags: [], createdAt: Date.now() },
    { id: 'cal-4', title: 'Презентація проекту', status: TaskStatus.INBOX, isEvent: true, scheduledDate: today + (86400000 * 5), priority: Priority.UI, difficulty: 3, xp: 300, tags: ['робота'], createdAt: Date.now() },
    { id: 'cal-5', title: 'Оплата оренди', status: TaskStatus.INBOX, isEvent: true, scheduledDate: today + (86400000 * 7), priority: Priority.UI, difficulty: 1, xp: 50, tags: [], createdAt: Date.now() },
    // Звички (5)
    { id: 'hab-1', title: 'Медитація 10хв', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 30, tags: ['habit'], createdAt: Date.now(), projectSection: 'habits', habitHistory: { [dateStr]: { status: 'completed' } } },
    { id: 'hab-2', title: 'Читання 20 стор', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 40, tags: ['habit'], createdAt: Date.now(), projectSection: 'habits' },
    { id: 'hab-3', title: 'Планка 2хв', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 25, tags: ['habit'], createdAt: Date.now(), projectSection: 'habits' },
    { id: 'hab-4', title: 'Вода 2л', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 20, tags: ['habit'], createdAt: Date.now(), projectSection: 'habits' },
    { id: 'hab-5', title: 'English 15m', status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 50, tags: ['habit'], createdAt: Date.now(), projectSection: 'habits' }
  ];

  // 6. Diary Entries (5)
  const diary: DiaryEntry[] = [
    { id: 'd-1', date: dateStr, content: JSON.stringify([{id:'b1', type:'heading', content:'Старт нового циклу'}, {id:'b2', type:'text', content:'Сьогодні запустив систему 12TR. Відчуття контролю повертається.'}]), createdAt: Date.now(), updatedAt: Date.now() },
    { id: 'd-2', date: new Date(today - 86400000).toISOString().split('T')[0], content: JSON.stringify([{id:'b3', type:'text', content:'День був насичений, але фокус тримаю.'}]), createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000 },
    { id: 'd-3', date: new Date(today - 172800000).toISOString().split('T')[0], content: JSON.stringify([{id:'b4', type:'quote', content:'Майбутнє залежить від того, що ви робите сьогодні.'}]), createdAt: Date.now() - 172800000, updatedAt: Date.now() - 172800000 },
    { id: 'd-4', date: new Date(today - 259200000).toISOString().split('T')[0], content: JSON.stringify([{id:'b5', type:'text', content:'Зустріч з командою пройшла продуктивно.'}]), createdAt: Date.now() - 259200000, updatedAt: Date.now() - 259200000 },
    { id: 'd-5', date: new Date(today - 345600000).toISOString().split('T')[0], content: JSON.stringify([{id:'b6', type:'heading', content:'Ретро тижня'}, {id:'b7', type:'task', content:'Переглянути цілі на квартал', checked: true}]), createdAt: Date.now() - 345600000, updatedAt: Date.now() - 345600000 }
  ];

  return {
    tags, hobbies, projects, people, tasks: [...coreTasks, ...insightNotes], diary, timeBlocks
  };
};

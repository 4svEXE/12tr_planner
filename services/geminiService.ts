
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Task, Project, TaskStatus, Person } from "../types";

// Always use named parameter for apiKey and direct process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCharacterDailyBriefing = async (character: Character, tasks: Task[], projects: Project[]) => {
  const prompt = `
    Зіграй роль ${character.name}, мудрого наставника раси ${character.race} у фентезійному світі стратегії.
    Погляди користувача на життя: ${character.views.join(", ")}
    Цілі користувача: ${character.goals.join(", ")}
    
    Завдання на сьогодні: ${tasks.map(t => t.title).join(", ")}
    Активні проєкти: ${projects.map(p => p.name).join(", ")}
    
    Надай ранковий брифінг УКРАЇНСЬКОЮ МОВОЮ. Він має включати:
    1. Мотиваційне фентезійне привітання.
    2. "Квест Дня" (найважливіше завдання).
    3. Коротку "Статтю мудрості" (макс 100 слів), що відповідає їхнім цілям.
    
    Формат відповіді — JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          greeting: { type: Type.STRING },
          questOfDay: { type: Type.STRING },
          article: { type: Type.STRING },
          motivation: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzePersonPortrait = async (person: Person, userCharacter: Character) => {
  const memoriesStr = person.memories.map(m => `${m.date}: ${m.event} (${m.emotion})`).join('\n');
  const notesStr = person.notes.map(n => `${n.date}: ${n.text}`).join('\n');

  const prompt = `
    Проаналізуй контакт у соціальній мережі користувача.
    Користувач (Герой): ${userCharacter.name}, архетип: ${userCharacter.archetype}.
    Контакт: ${person.name}, статус: ${person.status}, інтереси: ${person.hobbies.join(', ')}.
    
    Історія спогадів:
    ${memoriesStr}
    
    Нотатки:
    ${notesStr}
    
    Твоє завдання — створити AI-портрет цієї людини УКРАЇНСЬКОЮ МОВОЮ.
    Він має включати:
    1. Резюме (короткий опис характеру та важливості для Героя).
    2. Аналіз інтересів (на що людина звертає увагу).
    3. Тон спілкування (як з нею краще розмовляти).
    4. 3-5 потенційних тем для наступної розмови.
    
    Відповідай у форматі JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          interests: { type: Type.ARRAY, items: { type: Type.STRING } },
          tone: { type: Type.STRING },
          topics: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeSocialPresence = async (platform: string, handle: string, content?: string) => {
  const prompt = `
    Ти — ШІ-аналітик соціальних зв'язків. 
    Проаналізуй дані профілю "${handle}" на платформі "${platform}".
    ${content ? `Ось текст останніх постів або біографія: "${content}"` : 'Проаналізуй наявну інформацію.'}

    Витягни максимум корисної інформації УКРАЇНСЬКОЮ МОВОЮ:
    1. Хобі та інтереси (масив рядків).
    2. Потенційні життєві цілі людини (масив рядків).
    3. Важливі факти для нотаток (масив рядків).
    4. Короткий висновок про особистість.

    Відповідай у форматі JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hobbies: { type: Type.ARRAY, items: { type: Type.STRING } },
          goals: { type: Type.ARRAY, items: { type: Type.STRING } },
          notes: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeDailyReport = async (reportContent: string, character: Character) => {
  const prompt = `
    Проаналізуй цей щоденний звіт користувача та витягни з нього корисні ідеї для системи GTD та ігрового двигуна життя.
    Біо героя: ${character.bio}
    Візія: ${character.vision}

    Звіт користувача:
    ${reportContent}

    Твоє завдання — згенерувати пропозиції у наступних категоріях:
    1. 'task' (Наступні дії/квести)
    2. 'project' (Нові цілі або підпроєкти)
    3. 'habit' (Звички, які потрібно впровадити або відновити)
    4. 'achievement' (Досягнення за сьогодні, які варто зафіксувати)
    5. 'note' (Цінні ідеї або мрії для бази знань)
    6. 'event' (Заплановані події або дедлайни)

    Відповідай УКРАЇНСЬКОЮ у форматі JSON (масив об'єктів).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "One of: task, project, habit, achievement, note, event" },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            reason: { type: Type.STRING, description: "Чому ти це пропонуєш на основі тексту звіту?" }
          },
          required: ["type", "title", "reason"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const planProjectStrategically = async (
  projectTitle: string,
  projectDescription: string,
  character: Character
) => {
  const prompt = `
    Ти — верховний стратег і наставник Героя: ${character.name} (${character.race} ${character.archetype}).
    Візія героя: ${character.vision}
    Цілі: ${character.goals.join(", ")}

    Допоможи спланувати новий стратегічний проєкт: "${projectTitle}".
    Опис проєкту: ${projectDescription}

    Твоє завдання — розробити план за методологією GTD та 12-тижневого року:
    1. "Наступні дії" (Next Actions) — 3-5 конкретних фізичних кроків для негайного старту.
    2. "Підпроєкти" (Bosses) — 2-3 великі етапи, кожен з яких містить 3 власні завдання.
    3. "Звички" (Habits) — 1-2 щоденні або щотижневі дії для підтримки імпульсу.

    Відповідай УКРАЇНСЬКОЮ МОВОЮ у форматі JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nextActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          subprojects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "tasks"]
            }
          },
          habits: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["nextActions", "subprojects", "habits"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const suggestNextAction = async (project: Project, currentTasks: Task[]) => {
  const completedTasks = currentTasks.filter(t => t.status === TaskStatus.DONE).map(t => t.title).join(", ");
  const prompt = `
    На основі проєкту "${project.name}" та цих завершених завдань: ${completedTasks},
    яка наступна мінімальна фізична дія потрібна, щоб просунути проєкт вперед? 
    Думай як експерт з GTD. Відповідай УКРАЇНСЬКОЮ.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
};

export const autoSortInbox = async (inboxTasks: string[], characterContext: Character) => {
  const prompt = `
    Розподіли ці вхідні завдання за матрицею Ейзенхауера (UI, NUI, UNI, NUNI) на основі профілю:
    Біо: ${characterContext.bio}
    Цілі: ${characterContext.goals.join(", ")}
    
    Завдання: ${inboxTasks.join(", ")}
    Відповідай УКРАЇНСЬКОЮ у форматі JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: { type: Type.STRING, description: "One of: UI, NUI, UNI, NUNI" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
};

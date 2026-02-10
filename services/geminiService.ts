
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Task, Project, TaskStatus, Person } from "../types";

// Функція для отримання актуального ключа
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getCharacterDailyBriefing = async (character: Character, tasks: Task[], projects: Project[]) => {
  const ai = getAiClient();
  const prompt = `
    Зіграй роль ${character.name}, мудрого наставника раси ${character.race} у фентезійному світі стратегії.
    Роль героя: ${character.role}
    Погляди користувача на життя: ${character.views.join(", ")}
    Цілі користувача: ${character.goals.join(", ")}
    Вподобання: ${character.preferences.workStyle}, ${character.preferences.planningStyle}
    
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

  return JSON.parse(response.text || '{}');
};

/**
 * АНАЛІЗ ЩОДЕННОГО ЗВІТУ (DAILY REPORT)
 */
export const analyzeDailyReport = async (reportContent: string, character: Character) => {
  const ai = getAiClient();
  const prompt = `
    Ти — Стратегічне Ядро ігрового двигуна життя 12TR. 
    Проаналізуй щоденний звіт Гравця та витягни з нього корисні артефакти для системи GTD та особистого розвитку.
    
    КОНТЕКСТ ГЕРОЯ:
    - Ім'я: ${character.name}
    - Візія: ${character.vision}
    - Поточні цілі: ${character.goals.join(", ")}

    ТЕКСТ ЗВІТУ ГРАВЦЯ:
    """
    ${reportContent}
    """

    ТВОЄ ЗАВДАННЯ:
    Згенеруй масив пропозицій (suggestions) для Гравця. Кожна пропозиція повинна мати тип:
    - 'task', 'project', 'habit', 'achievement', 'note', 'event'.

    ВІДПОВІДАЙ ТІЛЬКИ УКРАЇНСЬКОЮ МОВОЮ У ФОРМАТІ JSON.
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
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["type", "title", "description", "reason"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const analyzePersonPortrait = async (person: Person, userCharacter: Character) => {
  const ai = getAiClient();
  const memoriesStr = person.memories.map(m => `${m.date}: ${m.event}`).join('\n');
  const notesStr = person.notes.map(n => `${n.date}: ${n.text}`).join('\n');
  
  const trustLevel = person.rating >= 51 ? 'ЛЕГЕНДАРНИЙ ПАРТНЕР' : person.rating >= 21 ? 'СОЮЗНИК' : 'ЗНАЙОМИЙ';

  const prompt = `
    Проаналізуй контакт у соціальній мережі користувача.
    Користувач (Герой): ${userCharacter.name}, архетип: ${userCharacter.archetype}.
    Контакт: ${person.name}, статус: ${person.status}, інтереси: ${person.hobbies.join(', ')}.
    ПОТОЧНИЙ РІВЕНЬ ДОВІРИ: ${trustLevel} (Karma: ${person.rating || 0}/100)
    
    Історія: ${memoriesStr} | Нотатки: ${notesStr}
    
    Твоє завдання — створити AI-портрет УКРАЇНСЬКОЮ МОВОЮ у форматі JSON.
    Включи:
    1. summary (характер).
    2. topics (теми для розмови).
    3. strategy (Порада: якщо рівень СОЮЗНИК — обов'язково запропонуй 2-3 ідеї подарунків; якщо ЛЕГЕНДАРНИЙ — запропонуй ідею спільного бізнес-проекту чи стратегічного партнерства, що базується на ваших спільних інтересах).
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
          topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          strategy: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeSocialPresence = async (platform: string, handle: string, content?: string) => {
  const ai = getAiClient();
  const prompt = `
    Проаналізуй дані профілю "${handle}" на "${platform}".
    Знайди факти, інтереси та дату народження УКРАЇНСЬКОЮ МОВОЮ.
    Відповідай у форматі JSON: {hobbies: [], goals: [], notes: [], summary: "", birthDate: "YYYY-MM-DD"|null}.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || '{}');
};

export const planProjectStrategically = async (title: string, desc: string, character: Character) => {
  const ai = getAiClient();
  const prompt = `Допоможи спланувати проєкт: "${title}". Опис: ${desc}. Герой: ${character.name}. Відповідай JSON: {nextActions: [], subprojects: [{title: "", tasks: []}], habits: []} УКРАЇНСЬКОЮ.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};

export const processInboxWithAi = async (tasks: any[], character: Character, people: string[]) => {
  const ai = getAiClient();
  const prompt = `Розклади вхідні завдання по категоріях (tasks, notes, project). Герой: ${character.name}. Відомі люди: ${people.join(", ")}. Відповідай масивом JSON УКРАЇНСЬКОЮ.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '[]');
};

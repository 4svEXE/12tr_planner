
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Task, Project, TaskStatus } from "../types";

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

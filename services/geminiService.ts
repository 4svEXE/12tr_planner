
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

export const suggestNextAction = async (project: Project, currentTasks: Task[]) => {
  // Use TaskStatus enum for comparison instead of string literal
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

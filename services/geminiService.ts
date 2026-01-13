
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Task, Project, TaskStatus, Person } from "../types";

// Функція для отримання актуального ключа
const getAiClient = () => {
  // Use named parameter { apiKey } as per guidelines
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set it in Settings.");
  }
  return new GoogleGenAI({ apiKey });
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

  // Use .text property directly
  return JSON.parse(response.text || '{}');
};

export const analyzePersonPortrait = async (person: Person, userCharacter: Character) => {
  const ai = getAiClient();
  const memoriesStr = person.memories.map(m => `${m.date}: ${m.event} (${m.emotion})`).join('\n');
  const notesStr = person.notes.map(n => `${n.date}: ${n.text}`).join('\n');

  const prompt = `
    Проаналізуй контакт у соціальній мережі користувача.
    Користувач (Герой): ${userCharacter.name}, роль: ${userCharacter.role}, архетип: ${userCharacter.archetype}.
    Контакт: ${person.name}, status: ${person.status}, інтереси: ${person.hobbies.join(', ')}.
    
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

  // Use .text property directly
  return JSON.parse(response.text || '{}');
};

export const analyzeSocialPresence = async (platform: string, handle: string, content?: string) => {
  const ai = getAiClient();
  const prompt = `
    Ти — ШІ-аналітик соціальних зв'язків. 
    Проаналізуй дані профілю "${handle}" на платформі "${platform}".
    ${content ? `Ось текст останніх постів або біографія: "${content}"` : 'Проаналізуй наявну інформацію.'}

    Твоє завдання — знайти факти, інтереси та ПЕРЕВІРИТИ ДАТУ НАРОДЖЕННЯ УКРАЇНСЬКОЮ МОВОЮ:
    1. Хобі та інтереси (масив рядків).
    2. Потенційні життєві цілі людини (масив рядків).
    3. Важливі факти для нотаток (масив рядків). НЕ ВИГАДУЙ, використовуй тільки те, що можна знайти в біо або постах.
    4. Короткий висновок про особистість.
    5. Дата народження у форматі YYYY-MM-DD (якщо знайдеш, інакше NULL).

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
          summary: { type: Type.STRING },
          birthDate: { type: Type.STRING, nullable: true }
        }
      }
    }
  });

  // Use .text property directly
  return JSON.parse(response.text || '{}');
};

export const analyzeDailyReport = async (reportContent: string, character: Character) => {
  const ai = getAiClient();
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
    // Use correct complex task model
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

  // Use .text property directly
  return JSON.parse(response.text || '[]');
};

export const planProjectStrategically = async (
  projectTitle: string,
  projectDescription: string,
  character: Character
) => {
  const ai = getAiClient();
  const prompt = `
    Ти — верховний стратег і наставник Героя: ${character.name} (${character.race} ${character.archetype}).
    Візія героя: ${character.vision}
    Цілі: ${character.goals.join(", ")}

    Допоможи спланувати новий стратегічний проєкт: "${projectTitle}".
    Опис проєкту: ${projectDescription}

    Твоє завдання — розробити план за методологією GTD та 12-тижневого року:
    1. "Наступні дії" (Next Actions) — 3-5 конкретних фізичних кроків для негайного старту.
    2. "Підпроєкти" (Bosses) — 2-3 великі етапи, кожен з яких місит 3 власні завдання.
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

  // Use .text property directly
  return JSON.parse(response.text || '{}');
};

export const processInboxWithAi = async (tasks: {id: string, title: string, content?: string}[], characterContext: Character, existingPeople: string[]) => {
  const ai = getAiClient();
  const prompt = `
    Ти — верховний стратег GTD та ігрового двигуна життя.
    Проаналізуй ці вхідні (заголовки + опис) і розклади все по поличках.
    Герой: ${characterContext.name}, Візія: ${characterContext.vision}, Роль: ${characterContext.role}.
    Вподобання героя: ${characterContext.preferences.workStyle}, ${characterContext.preferences.planningStyle}.
    Відомі люди: ${existingPeople.join(", ")}.

    Завдання для розбору:
    ${tasks.map(t => `- [ID:${t.id}] Заголовок: "${t.title}". Опис: "${t.content || 'немає'}"`).join('\n')}

    ДЛЯ КОЖНОГО ЗАВДАННЯ ПРИЙМИ РІШЕННЯ:
    1. Категорія: 'tasks', 'notes', 'project'.
    2. Декомпозиція: витягни 'subtasks', 'habits', 'events', 'people'.
    3. Профіль Героя: чи містить текст важливу інфу про зміну поглядів, нову роль, зміну вподобань або нові обмеження фокусу (focusBlockers)?
       Якщо так, додай це в 'profileImpact'.

    Відповідай УКРАЇНСЬКОЮ у форматі JSON (масив об'єктів).
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
            id: { type: Type.STRING },
            category: { type: Type.STRING },
            priority: { type: Type.STRING },
            status: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            reason: { type: Type.STRING },
            decomposition: {
                type: Type.OBJECT,
                properties: {
                    subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                    habits: { type: Type.ARRAY, items: { type: Type.STRING } },
                    events: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, date: { type: Type.STRING } } } },
                    people: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, status: { type: Type.STRING }, note: { type: Type.STRING } } } }
                }
            },
            profileImpact: {
                type: Type.OBJECT,
                properties: {
                    bioUpdate: { type: Type.STRING },
                    roleUpdate: { type: Type.STRING },
                    newGoal: { type: Type.STRING },
                    newBelief: { type: Type.STRING },
                    workStyleUpdate: { type: Type.STRING },
                    newFocusBlocker: { type: Type.STRING }
                }
            }
          },
          required: ["id", "category", "priority", "status", "tags", "reason"]
        }
      }
    }
  });

  // Use .text property directly
  return JSON.parse(response.text || '[]');
};

# 12TR Planner — UI Component Guidelines

> Цей документ є **обов'язковим** статутом для всіх AI-агентів та розробників проєкту.
> Перед будь-якими змінами UI — прочитай цей файл.

---

## 🏗️ Технічний стек

| Шар | Технологія |
|-----|-----------|
| UI Framework | React 19 + TypeScript |
| Стилі | Tailwind CSS (CDN в `index.html`) |
| Токени | CSS Custom Properties у `<style>` в `index.html` |
| Іконки | Font Awesome 6 (`fa-solid`, `fa-brands`) |
| Шрифт | Montserrat (Google Fonts) |

---

## 🎨 Дизайн-токени (CSS Variables)

Всі **базові значення** зберігаються як CSS-змінні. **Не хардкоди кольори!**

```css
/* Завжди використовуй через var() */
var(--primary)        /* Акцентний колір теми */
var(--bg-main)        /* Фон сторінки */
var(--bg-sidebar)     /* Фон сайдбару */
var(--bg-card)        /* Фон картки */
var(--bg-input)       /* Фон інпута (форми) */
var(--text-main)      /* Основний текст */
var(--text-muted)     /* Приглушений текст */
var(--text-sidebar)   /* Текст у сайдбарі */
var(--border-color)   /* Колір рамок */
var(--radius)         /* 12px — радіус кутів */
```

**Tailwind-аліаси** з `index.html`:
```
bg-primary / text-primary → var(--primary)
bg-card / bg-input / bg-main → var(--bg-*)
text-text-main / text-text-muted → var(--text-*)
```

---

## 📦 Компонентна бібліотека (`components/ui/`)

### ⚠️ Золоте правило
> **Ніколи не пиши бізнес-логіку в `components/ui/`.** Ці компоненти повинні бути universally reusable без контекстів (`AppContext`, `AuthContext`).

---

### `Button.tsx`

```tsx
<Button variant="primary" | "secondary" | "ghost" | "danger" | "white" size="sm" | "md" | "lg" | "icon" icon="fa-plus" loading={false}>
  Текст
</Button>
```

| Prop | Тип | За замовч. | Опис |
|------|-----|-----------|------|
| `variant` | string | `primary` | Візуальний стиль |
| `size` | string | `md` | Розмір кнопки |
| `icon` | string | — | FA-іконка |
| `loading` | boolean | `false` | Спінер замість контенту |

---

### `IconButton.tsx`

Для **маленьких іконок-кнопок** у рядках, тулбарах, списках.

```tsx
<IconButton icon="fa-plus" variant="ghost" | "emerald" | "danger" | "primary" size="sm" | "md" onClick={...} title="Тултіп" />
```

> **Завжди** використовуй `IconButton` замість `<button className="w-6 h-6 rounded-lg hover:bg-...">`.

---

### `Card.tsx`

```tsx
<Card padding="none" | "sm" | "md" | "lg" border={true | false} blur={false} hover={false}>
  ...
</Card>
```

> **Важливо:** `border={false}` прибирає рамку повністю.

---

### `Badge.tsx`

```tsx
<Badge variant="orange" | "emerald" | "rose" | "slate" | "yellow" | "indigo" icon="fa-flag">
  Текст
</Badge>
```

---

### `Input.tsx`

Головний компонент для всіх `<input>` у проєкті.

```tsx
// Форма/модалка:
<Input value={...} onChange={...} label="Email" placeholder="..." icon="fa-search" />

// Вбудований (inline, без фону):
<Input variant="ghost" value={...} onChange={...} />
```

| Prop | Тип | За замовч. | Опис |
|------|-----|-----------|------|
| `variant` | `default` \| `ghost` | `default` | `ghost` = прозорий без паддінгів |
| `label` | string | — | Лейбл над полем |
| `icon` | string | — | FA-іконка зліва |
| `error` | string | — | Текст помилки |

> **КРИТИЧНО:** `variant="ghost"` додає клас `ui-ghost-input`, який виключений з глобального CSS-override. Ніколи не пиши сирий `<input>` для вбудованих полів — тільки `<Input variant="ghost">`.

---

## 🚫 Заборонені патерни

### ❌ Не хардкодь кольори
```tsx
// НЕПРАВИЛЬНО
<div className="bg-gray-800 text-white">
// ПРАВИЛЬНО
<div className="bg-[var(--bg-card)] text-[var(--text-main)]">
```

### ❌ Не пиши сирі іконки-кнопки
```tsx
// НЕПРАВИЛЬНО
<button className="w-6 h-6 rounded-lg hover:bg-emerald-50 text-emerald-500">
  <i className="fa-solid fa-plus text-[9px]"></i>
</button>

// ПРАВИЛЬНО
<IconButton icon="fa-plus" variant="emerald" size="sm" />
```

### ❌ Не пиши сирі `<input>` для вбудованих полів
```tsx
// НЕПРАВИЛЬНО — буде зламано глобальним CSS
<input className="!bg-transparent !h-max !min-h-0 ..." value={...} />

// ПРАВИЛЬНО
<Input variant="ghost" value={...} onChange={...} className="..." />
```

### ❌ Не пиши `!important` в інлайн-стилях
```tsx
// НЕПРАВИЛЬНО — React ігнорує !important в style={}
style={{ backgroundColor: 'transparent !important' }}

// ПРАВИЛЬНО — використовуй ui-ghost-input клас через Input компонент
```

---

## 📐 Система відступів (Spacing)

| Контекст | Відступ | Клас |
|----------|---------|------|
| Рядок списку (сайдбар) | 28px висота | `h-7` |
| Рядок списку (контент) | — | `py-1 px-3` |
| Відступ вкладеності | 12px/рівень | `style={{ marginLeft: depth * 12 }}` |
| Gap між елементами рядка | 8px | `gap-2` |
| Мікро-gap (іконки) | 6px | `gap-1.5` |

---

## 🎯 Типографіка

| Елемент | Клас |
|---------|------|
| Заголовок сторінки | `text-xl font-black` |
| Назва картки | `text-[13px] font-semibold` |
| Рядок списку | `text-[12px] font-normal` |
| Лейбл папки/секції | `text-[11px] font-black uppercase tracking-widest` |
| Мета-інформація | `text-[10px] font-bold text-[var(--text-muted)]` |
| Мікро-лейбл | `text-[9px] font-black uppercase tracking-widest` |

---

## 🗂️ Структура папок

```
components/
  ui/               ← Тільки universal components, без бізнес-логіки
    index.ts        ← Barrel export (import { Button, Input } from '../ui')
    Button.tsx
    Card.tsx
    Badge.tsx
    Input.tsx
    IconButton.tsx
    Typography.tsx
    NotificationToast.tsx
  lists/            ← List-specific components
  sidebar/          ← Sidebar-specific components
  calendar/         ← Calendar feature
  planner/          ← Planner feature
  ...
views/              ← Page-level components (мають контекст)
contexts/           ← AppContext, AuthContext
types/              ← TypeScript interfaces
```

---

## 📝 Чеклист перед коміттю

- [ ] Колір береться з `var(--token)`, не хардкодиться
- [ ] Сирі `<input>` замінені на `<Input>` або `<Input variant="ghost">`
- [ ] Маленькі кнопки-іконки замінені на `<IconButton>`
- [ ] Компонент у `ui/` не має імпортів бізнес-контекстів
- [ ] Нові компоненти додані до `ui/index.ts`

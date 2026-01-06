
export interface PlanningTip {
  text: string;
  author?: string;
  category: 'GTD' | '12TR' | 'Game Design' | 'Psychology';
}

export const PLANNING_TIPS: PlanningTip[] = [
  {
    text: "Ваш мозок призначений для створення ідей, а не для їх зберігання.",
    author: "Девід Аллен",
    category: "GTD"
  },
  {
    text: "Ми часто переоцінюємо те, що можемо зробити за рік, і недооцінюємо те, що можемо зробити за 12 тижнів.",
    author: "Брайан Моран",
    category: "12TR"
  },
  {
    text: "Боси (підпроєкти) існують для того, щоб велика ціль не здавалася непереможною. Розбийте їх на вразливості.",
    category: "Game Design"
  },
  {
    text: "Якщо завдання займає менше двох хвилин — зроби його негайно.",
    author: "Девід Аллен",
    category: "GTD"
  },
  {
    text: "Дисципліна — це вибір між тим, чого ви хочете зараз, і тим, чого ви хочете найбільше.",
    category: "Psychology"
  }
];

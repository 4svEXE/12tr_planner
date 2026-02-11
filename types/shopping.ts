
export interface ShoppingStore {
  id: string;
  name: string;
  icon: string;
  color: string;
  updatedAt: number;
  // Поля для спільного доступу
  ownerEmail?: string;
  collaborators?: string[]; // Список email користувачів, які мають доступ
  isShared?: boolean;
}

export interface PriceEntry {
  id: string;
  price: number;
  storeName: string;
  date: number;
}

export interface ShoppingItem {
  id: string;
  storeId: string;
  name: string;
  isBought: boolean;
  priceHistory?: PriceEntry[];
  note?: string;
  updatedAt: number;
  lastModifiedBy?: string; // Email того, хто останній змінив статус
}

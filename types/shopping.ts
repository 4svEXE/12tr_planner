
export interface ShoppingStore {
  id: string;
  name: string;
  icon: string;
  color: string;
  // Fix: Added missing updatedAt property
  updatedAt: number;
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
  // Fix: Added missing updatedAt property
  updatedAt: number;
}
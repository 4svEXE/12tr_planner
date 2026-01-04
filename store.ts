
import { StoreState } from './types';

const STORAGE_KEY = '12tr_gamified_engine_state';

export const saveState = (state: StoreState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state to localStorage", error);
  }
};

export const loadState = (): StoreState | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as StoreState;
  } catch (error) {
    console.error("Failed to load state from localStorage", error);
    return null;
  }
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};

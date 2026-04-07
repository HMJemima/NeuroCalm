import { create } from 'zustand';

const STORAGE_KEY = 'neurocalm_sidebar_collapsed';

function getInitialCollapsedState() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === 'true';
}

const useSidebarStore = create((set) => ({
  isCollapsed: getInitialCollapsedState(),
  setCollapsed: (nextValue) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(nextValue));
    }
    set({ isCollapsed: nextValue });
  },
  toggleCollapsed: () => set((state) => {
    const nextValue = !state.isCollapsed;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(nextValue));
    }
    return { isCollapsed: nextValue };
  }),
}));

export default useSidebarStore;

import { create } from 'zustand';

interface UIState {
  /** Whether the sidebar is collapsed to icon-rail mode */
  sidebarCollapsed: boolean;
  /** Whether the right Now Playing / Queue panel is open */
  rightPanelOpen: boolean;
  rightPanelTab: 'nowplaying' | 'queue';
  /** Whether the full-screen Now Playing overlay is open (mobile) */
  nowPlayingOpen: boolean;
  /** Active toast messages */
  toasts: Toast[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  durationMs?: number;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleRightPanel: (tab?: 'nowplaying' | 'queue') => void;
  setRightPanelTab: (tab: 'nowplaying' | 'queue') => void;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  sidebarCollapsed: false,
  rightPanelOpen: false,
  rightPanelTab: 'nowplaying',
  nowPlayingOpen: false,
  toasts: [],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  toggleRightPanel: (tab) => {
    const { rightPanelOpen, rightPanelTab } = get();
    if (tab && rightPanelOpen && rightPanelTab === tab) {
      set({ rightPanelOpen: false });
    } else if (tab) {
      set({ rightPanelOpen: true, rightPanelTab: tab });
    } else {
      set({ rightPanelOpen: !rightPanelOpen });
    }
  },

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  openNowPlaying: () => set({ nowPlayingOpen: true }),
  closeNowPlaying: () => set({ nowPlayingOpen: false }),

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => get().removeToast(id), toast.durationMs ?? 3000);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

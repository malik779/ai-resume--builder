import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  previewMode: boolean;
  upgradeModalOpen: boolean;
  upgradeModalTier: string | null;
  isNavigating: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setPreviewMode: (preview: boolean) => void;
  openUpgradeModal: (tier: string) => void;
  closeUpgradeModal: () => void;
  setNavigating: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  previewMode: false,
  upgradeModalOpen: false,
  upgradeModalTier: null,
  isNavigating: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPreviewMode: (previewMode) => set({ previewMode }),
  openUpgradeModal: (tier) => set({ upgradeModalOpen: true, upgradeModalTier: tier }),
  closeUpgradeModal: () => set({ upgradeModalOpen: false, upgradeModalTier: null }),
  setNavigating: (isNavigating) => set({ isNavigating }),
}));

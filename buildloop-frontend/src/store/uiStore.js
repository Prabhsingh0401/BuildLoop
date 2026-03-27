import { create } from 'zustand';

const useUIStore = create((set) => ({
  // Modal state
  activeModal: null,           // string | null — name of the open modal
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),

  // Drawer state
  activeDrawer: null,          // string | null — name of the open drawer
  openDrawer: (name) => set({ activeDrawer: name }),
  closeDrawer: () => set({ activeDrawer: null }),
}));

export default useUIStore;

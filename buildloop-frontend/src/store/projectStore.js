import { create } from 'zustand';

const useProjectStore = create((set) => ({
  activeProjectId: null,       // string | null — Mongo ObjectId of active project
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  clearActiveProjectId: () => set({ activeProjectId: null }),
}));

export default useProjectStore;

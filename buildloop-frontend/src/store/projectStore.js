import { create } from 'zustand';

const useProjectStore = create((set) => ({
  activeProjectId: null,       // string | null — Mongo ObjectId of active project
  activeProjectRole: null,     // 'owner' | 'member' | null — role in active project
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setActiveProject: (id, role) => set({ activeProjectId: id, activeProjectRole: role }),
  clearActiveProjectId: () => set({ activeProjectId: null, activeProjectRole: null }),
}));

export default useProjectStore;

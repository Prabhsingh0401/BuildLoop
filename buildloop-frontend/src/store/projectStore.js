import { create } from 'zustand';

const useProjectStore = create((set) => ({
  activeProjectId: null,       // string | null — Mongo ObjectId of active project
  activeProjectRole: null,     // 'owner' | 'member' | null — role in active project
  isCreateModalOpen: false,    // boolean — visibility of project creation modal
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setActiveProject: (id, role) => set({ activeProjectId: id, activeProjectRole: role }),
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
  clearActiveProjectId: () => set({ activeProjectId: null, activeProjectRole: null }),
}));

export default useProjectStore;

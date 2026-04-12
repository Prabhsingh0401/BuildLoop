import { Plus } from 'lucide-react';
import useUIStore from '@/store/uiStore.js';
import KanbanBoard from '@/components/kanban/KanbanBoard.jsx';
import CreateTaskModal from '@/components/kanban/CreateTaskModal.jsx';

export default function Kanban() {
  const { openModal } = useUIStore();

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Kanban Board
          </h2>
          <p className="text-sm text-ink-3 mt-0.5">
            Track and manage tasks across your team
          </p>
        </div>
        <button
          onClick={() => openModal('createTask')}
          className="bg-brand text-white hover:bg-brand-dark
                     rounded-input px-4 py-2 text-sm font-semibold
                     flex items-center gap-2 transition-colors"
        >
          <Plus size={15} strokeWidth={2} />
          New Task
        </button>
      </div>

      {/* Board */}
      <KanbanBoard />

      {/* Modal */}
      <CreateTaskModal />
    </div>
  );
}

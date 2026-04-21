import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import useProjectStore from '@/store/projectStore.js';
import Column from './Column.jsx';
import TaskCard from './TaskCard.jsx';
import TaskDetailDrawer from './TaskDetailDrawer.jsx';
import apiClient from '@/api/client.js';

const COLUMNS = [
  { key: 'todo', label: 'Todo', dotClass: 'bg-white/20' },
  { key: 'in-progress', label: 'In Progress', dotClass: 'bg-brand shadow-[0_0_10px_rgba(59,91,219,0.5)]' },
  { key: 'review', label: 'Under Review', dotClass: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' },
  { key: 'done', label: 'Done', dotClass: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' },
];

async function fetchTasks(projectId) {
  const { data } = await apiClient.get(`/api/tasks/${projectId}`);
  return data.tasks;
}

async function fetchFeatures(projectId) {
  const { data } = await apiClient.get(`/api/features/${projectId}`);
  return data.features;
}

async function moveTask({ taskId, status }) {
  const { data } = await apiClient.patch(`/api/tasks/${taskId}`, { status });
  return data.task;
}

export default function KanbanBoard({ searchQuery = '' }) {
  const { activeProjectId } = useProjectStore();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', activeProjectId],
    queryFn: () => fetchTasks(activeProjectId),
    enabled: !!activeProjectId,
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features', activeProjectId],
    queryFn: () => fetchFeatures(activeProjectId),
    enabled: !!activeProjectId,
  });

  const featureMap = features.reduce((acc, f) => {
    acc[f._id] = f.title;
    return acc;
  }, {});

  const { mutate: updateStatus } = useMutation({
    mutationFn: moveTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
    },
  });

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t._id === active.id);
    const overId = over.id;

    // Over could be a column id or a task id
    const isOverColumn = COLUMNS.some(c => c.key === overId);
    const overColumnId = isOverColumn ? overId : tasks.find(t => t._id === overId)?.status;

    if (activeTask && overColumnId && activeTask.status !== overColumnId) {
      // Optimistic update status in local state before server call if desired
      // For now, just trigger the mutation
      updateStatus({ taskId: active.id, status: overColumnId });
      
      // Manually update tasks array in cache for smooth transition
      queryClient.setQueryData(['tasks', activeProjectId], (old) => {
        return old.map(t => t._id === active.id ? { ...t, status: overColumnId } : t);
      });
    }
  }, [tasks, updateStatus, queryClient, activeProjectId]);

  const handleDragEnd = () => {
    setActiveId(null);
  };

  if (!activeProjectId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/30 text-sm font-medium">Select a project to view board</p>
      </div>
    );
  }

  const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

  const filteredTasks = tasks.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      (t.description || '').toLowerCase().includes(query) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 overflow-x-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 h-full pb-6 w-full px-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              id={col.key}
              title={col.label}
              dotClass={col.dotClass}
              tasks={filteredTasks.filter((t) => t.status === col.key)}
              featureMap={featureMap}
              onCardClick={setSelectedTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeTask ? (
            <div className="scale-105 pointer-events-none shadow-2xl skew-x-1 -rotate-1 transition-transform">
              <TaskCard 
                task={activeTask} 
                feature={activeTask.featureId ? featureMap[activeTask.featureId] : null}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          featureName={selectedTask.featureId ? featureMap[selectedTask.featureId] : null}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

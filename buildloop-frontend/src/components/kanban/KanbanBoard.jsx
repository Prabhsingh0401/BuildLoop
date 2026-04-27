import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
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
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import useProjectStore from '@/store/projectStore.js';
import Column from './Column.jsx';
import TaskCard from './TaskCard.jsx';
import TaskDetailDrawer from './TaskDetailDrawer.jsx';
import apiClient from '@/api/client.js';

const COLUMNS = [
  { key: 'todo',        label: 'Todo',         dotClass: 'bg-white/20' },
  { key: 'in-progress', label: 'In Progress',  dotClass: 'bg-brand shadow-[0_0_10px_rgba(59,91,219,0.5)]' },
  { key: 'review',      label: 'Under Review', dotClass: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' },
  { key: 'done',        label: 'Done',         dotClass: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' },
];

async function fetchTasks(projectId) {
  const { data } = await apiClient.get(`/api/tasks/${projectId}`);
  return data.tasks;
}

async function fetchFeatures(projectId) {
  const { data } = await apiClient.get(`/api/features/${projectId}`);
  return data.features;
}

/** Fetch ALL subtasks for a project in one query (tasks that have a parentTaskId) */
async function fetchAllSubtasks(projectId) {
  // Backend returns only top-level tasks on GET /:projectId,
  // so we query with a special param to fetch subtasks for the whole project.
  // We piggy-back on the existing endpoint — subtasks share the same projectId.
  // The board endpoint already excludes subtasks; fetch full set via a second call.
  const { data } = await apiClient.get(`/api/tasks/${projectId}/all-subtasks`).catch(() => ({ data: { subtasks: [] } }));
  return data.subtasks ?? [];
}

async function moveTask({ taskId, status }) {
  const { data } = await apiClient.patch(`/api/tasks/${taskId}`, { status });
  return data.task;
}

export default function KanbanBoard({ searchQuery = '', filters = { assignee: 'all', date: 'all' } }) {
  const { activeProjectId } = useProjectStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeTab, setActiveTab] = useState(COLUMNS[0].key);

  const urlTaskId = searchParams.get('taskId');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', activeProjectId],
    queryFn:  () => fetchTasks(activeProjectId),
    enabled: !!activeProjectId,
  });

  const { data: features = [] } = useQuery({
    queryKey: ['features', activeProjectId],
    queryFn:  () => fetchFeatures(activeProjectId),
    enabled: !!activeProjectId,
  });

  const featureMap = features.reduce((acc, f) => {
    acc[f._id] = f.title;
    return acc;
  }, {});

  const { data: allSubtasks = [] } = useQuery({
    queryKey: ['allSubtasks', activeProjectId],
    queryFn: () => fetchAllSubtasks(activeProjectId),
    enabled: !!activeProjectId,
  });

  const subtaskStatsMap = (() => {
    const map = {};
    for (const sub of allSubtasks) {
      const pid = sub.parentTaskId;
      if (!map[pid]) map[pid] = { total: 0, doneCount: 0 };
      map[pid].total += 1;
      if (sub.status === 'done') map[pid].doneCount += 1;
    }
    for (const t of tasks) {
      const cached = queryClient.getQueryData(['subtasks', t._id]);
      if (cached) {
        map[t._id] = {
          total: cached.length,
          doneCount: cached.filter((s) => s.status === 'done').length,
        };
      }
    }
    return map;
  })();

  useEffect(() => {
    if (urlTaskId && tasks.length > 0 && !selectedTask) {
      const task = tasks.find((t) => t._id === urlTaskId);
      if (task) {
        setSelectedTask(task);
      }
    }
  }, [urlTaskId, tasks, selectedTask]);

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

    const activeTask    = tasks.find((t) => t._id === active.id);
    const overId        = over.id;
    const isOverColumn  = COLUMNS.some((c) => c.key === overId);
    const overColumnId  = isOverColumn ? overId : tasks.find((t) => t._id === overId)?.status;

    if (activeTask && overColumnId && activeTask.status !== overColumnId) {
      updateStatus({ taskId: active.id, status: overColumnId });
      queryClient.setQueryData(['tasks', activeProjectId], (old) =>
        old.map((t) => (t._id === active.id ? { ...t, status: overColumnId } : t))
      );
    }
  }, [tasks, updateStatus, queryClient, activeProjectId]);

  const handleDragEnd = () => setActiveId(null);

  const handleSelectTask = (task) => {
    // Always use the freshest copy from the tasks cache
    const fresh = tasks.find((t) => t._id === task._id) ?? task;
    setSelectedTask(fresh);
  };

  if (!activeProjectId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/30 text-sm font-medium">Select a project to view board</p>
      </div>
    );
  }

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  const filteredTasks = tasks.filter((t) => {
    // Search match
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(query) ||
      (t.description || '').toLowerCase().includes(query) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(query));

    // Assignee match
    const taskAssignee = t.assignee || null;
    let matchesAssignee = true;
    if (filters.assignee === 'unassigned') {
      matchesAssignee = !taskAssignee;
    } else if (filters.assignee !== 'all') {
      matchesAssignee = taskAssignee === filters.assignee;
    }

    // Date match
    let matchesDate = true;
    if (filters.date !== 'all' && t.createdAt) {
      const taskDate = new Date(t.createdAt);
      const now = new Date();
      if (filters.date === 'today') {
        matchesDate = taskDate.toDateString() === now.toDateString();
      } else if (filters.date === 'this-week') {
        const diff = now - taskDate;
        matchesDate = diff <= 7 * 24 * 60 * 60 * 1000;
      } else if (filters.date === 'this-month') {
        matchesDate = taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
      } else if (filters.date === 'last-3-months') {
        const diff = now - taskDate;
        matchesDate = diff <= 90 * 24 * 60 * 60 * 1000;
      } else if (filters.date === 'this-year') {
        matchesDate = taskDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesAssignee && matchesDate;
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
        {/* Mobile Tabs */}
        <div className="md:hidden flex gap-2 mb-4 px-4 overflow-x-auto no-scrollbar">
          {COLUMNS.map((col) => {
            const isActive = activeTab === col.key;
            return (
              <button
                key={col.key}
                onClick={() => setActiveTab(col.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'bg-ink text-white shadow-md' : 'bg-white/40 text-ink-3 hover:bg-white/60 border border-white/20'
                }`}
              >
                {col.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-5 h-full pb-6 w-full px-4">
          {COLUMNS.map((col) => (
            <div 
              key={col.key} 
              className={`w-full flex-col h-full flex-shrink-0 md:flex-shrink md:w-auto md:flex-1 ${activeTab === col.key ? 'flex' : 'hidden md:flex'}`}
            >
              <Column
                id={col.key}
                title={col.label}
                dotClass={col.dotClass}
                tasks={filteredTasks.filter((t) => t.status === col.key)}
                featureMap={featureMap}
                subtaskStatsMap={subtaskStatsMap}
                onCardClick={handleSelectTask}
              />
            </div>
          ))}
        </div>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } },
            }),
          }}
        >
          {activeTask ? (
            <div className="scale-105 pointer-events-none shadow-2xl skew-x-1 -rotate-1 transition-transform">
              <TaskCard
                task={activeTask}
                feature={activeTask.featureId ? featureMap[activeTask.featureId] : null}
                subtaskStats={subtaskStatsMap[activeTask._id]}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          featureName={selectedTask.featureId ? featureMap[selectedTask.featureId] : null}
          onClose={() => {
            setSelectedTask(null);
            if (searchParams.has('taskId')) {
              searchParams.delete('taskId');
              setSearchParams(searchParams);
            }
          }}
          onTaskUpdated={(updated) => {
            // Keep the drawer in sync after an edit
            setSelectedTask(updated);
            queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
          }}
        />
      )}
    </div>
  );
}

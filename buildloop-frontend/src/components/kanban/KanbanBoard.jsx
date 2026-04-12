import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useProjectStore from '@/store/projectStore.js';
import TaskCard from './TaskCard.jsx';
import apiClient from '@/api/client.js';

// Column definitions — order and labels are fixed per spec
const COLUMNS = [
  {
    key:       'todo',
    label:     'Todo',
    colorClass: 'bg-bg',
    headerClass: 'text-ink-2',
  },
  {
    key:       'in_progress',
    label:     'In Progress',
    colorClass: 'bg-brand-light',
    headerClass: 'text-brand',
  },
  {
    key:       'done',
    label:     'Done',
    colorClass: 'bg-success-light',
    headerClass: 'text-success',
  },
];

// Fetch all tasks for the active project
async function fetchTasks(projectId) {
  const { data } = await apiClient.get(`/tasks/${projectId}`);
  return data.tasks;
}

// Fetch all features for featureName lookup
async function fetchFeatures(projectId) {
  const { data } = await apiClient.get(`/features/${projectId}`);
  return data.features;
}

// Move task to a new status
async function moveTask({ taskId, status }) {
  const { data } = await apiClient.patch(`/tasks/${taskId}`, { status });
  return data.task;
}

export default function KanbanBoard() {
  const { activeProjectId } = useProjectStore();
  const queryClient         = useQueryClient();

  // Fetch tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
  } = useQuery({
    queryKey: ['tasks', activeProjectId],
    queryFn:  () => fetchTasks(activeProjectId),
    enabled:  !!activeProjectId,
  });

  // Fetch features for featureName resolution
  const { data: features = [] } = useQuery({
    queryKey: ['features', activeProjectId],
    queryFn:  () => fetchFeatures(activeProjectId),
    enabled:  !!activeProjectId,
  });

  // Build a featureId → title lookup map
  const featureMap = features.reduce((acc, f) => {
    acc[f._id] = f.title;
    return acc;
  }, {});

  // PATCH mutation for status move
  const { mutate: updateStatus } = useMutation({
    mutationFn: moveTask,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', activeProjectId],
      });
    },
  });

  function handleStatusMove(taskId, newStatus) {
    updateStatus({ taskId, status: newStatus });
  }

  function handleCardClick(task) {
    // Task detail view — to be wired up when detail drawer is built
    console.log('Task clicked:', task);
  }

  // No project selected state
  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-ink-3 text-sm">
          No project selected. Select a project to view the board.
        </p>
      </div>
    );
  }

  // Loading state
  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2
                          border-border border-t-brand animate-spin" />
          <span className="text-ink-3 text-sm font-semibold">
            Loading tasks…
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (tasksError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-danger text-sm">
          Failed to load tasks. Check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)] overflow-hidden">
      {COLUMNS.map((col) => {
        // Filter tasks for this column
        const colTasks = tasks.filter((t) => t.status === col.key);

        return (
          <div
            key={col.key}
            className={`${col.colorClass} rounded-card flex flex-col
                        flex-1 min-w-[280px] overflow-hidden`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between
                            px-4 py-3 flex-shrink-0">
              <span
                className={`text-sm font-semibold ${col.headerClass}`}
              >
                {col.label}
              </span>
              <span
                className="text-[11px] font-semibold bg-surface
                           text-ink-3 px-2 py-0.5 rounded-pill"
              >
                {colTasks.length}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-border mx-4 flex-shrink-0" />

            {/* Cards — scroll independently */}
            <div className="flex-1 overflow-y-auto px-3 py-3
                            flex flex-col gap-2">
              {colTasks.length === 0 ? (
                <p className="text-center text-ink-3 text-[12px]
                              py-6">
                  No tasks here
                </p>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    featureName={
                      task.featureId ? featureMap[task.featureId] : null
                    }
                    onStatusMove={handleStatusMove}
                    onClick={() => handleCardClick(task)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Tag, User, AlignLeft, Layers } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useProjectStore from '@/store/projectStore.js';
import apiClient from '@/api/client.js';

const TEAM_MEMBERS = ['Prableen', 'Jagjeevan', 'Eshaa', 'Arshdeep'];

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
];

const STATUS_STYLES = {
  todo:        'bg-bg text-ink-2',
  in_progress: 'bg-brand-light text-brand',
  done:        'bg-success-light text-success',
};

async function updateTask({ taskId, updates }) {
  const { data } = await apiClient.patch(`/tasks/${taskId}`, updates);
  return data.task;
}

export default function TaskDetailDrawer({ task, featureName, onClose }) {
  const { activeProjectId }  = useProjectStore();
  const queryClient          = useQueryClient();

  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput]     = useState('');
  const [assignee, setAssignee]       = useState('');
  const [status, setStatus]           = useState('todo');
  const [isDirty, setIsDirty]         = useState(false);
  const [saveError, setSaveError]     = useState('');

  // Sync local state when task prop changes
  useEffect(() => {
    if (task) {
      setDescription(task.description || '');
      setTagsInput((task.tags || []).join(', '));
      setAssignee(task.assignee || '');
      setStatus(task.status || 'todo');
      setIsDirty(false);
      setSaveError('');
    }
  }, [task?._id]);

  const { mutate: saveTask, isLoading: saving } = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', activeProjectId],
      });
      setIsDirty(false);
      setSaveError('');
    },
    onError: (err) => {
      setSaveError(
        err?.response?.data?.error || 'Failed to save. Try again.'
      );
    },
  });

  function handleSave() {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    saveTask({
      taskId: task._id,
      updates: { description, tags, assignee: assignee || null, status },
    });
  }

  function markDirty() {
    setIsDirty(true);
    setSaveError('');
  }

  if (!task) return null;

  const createdAt = new Date(task.createdAt).toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });

  const updatedAt = new Date(task.updatedAt).toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-[500px] max-h-[90vh] bg-surface
                   border border-border rounded-xl flex flex-col
                   shadow-2xl overflow-hidden"
      >
        {/* Drawer header */}
        <div className="flex items-start justify-between p-5
                        border-b border-border flex-shrink-0">
          <div className="flex flex-col gap-1.5 flex-1 mr-4">
            <p className="text-base font-semibold text-ink leading-snug">
              {task.title}
            </p>
            {featureName && (
              <span className="text-[12px] text-ink-3 flex items-center
                               gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand
                                 inline-block" />
                {featureName}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-ink-3 hover:text-ink transition-colors
                       flex-shrink-0 mt-0.5 p-1 rounded hover:bg-bg"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Drawer body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Status selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-ink-3
                              uppercase tracking-wide">
              Status
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatus(opt.value);
                    markDirty();
                  }}
                  className={[
                    'text-[12px] font-semibold px-3 py-1.5 rounded-pill',
                    'border transition-all',
                    status === opt.value
                      ? `${STATUS_STYLES[opt.value]} border-transparent`
                      : 'bg-bg text-ink-3 border-border hover:border-brand/30',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-ink-3
                              uppercase tracking-wide flex items-center
                              gap-1.5">
              <User size={12} />
              Assignee
            </label>
            <select
              value={assignee}
              onChange={(e) => { setAssignee(e.target.value); markDirty(); }}
              className="border border-border rounded-input px-3 py-2
                         text-sm text-ink bg-surface
                         focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="">Unassigned</option>
              {TEAM_MEMBERS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-ink-3
                              uppercase tracking-wide flex items-center
                              gap-1.5">
              <AlignLeft size={12} />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty(); }}
              placeholder="Add a description…"
              rows={4}
              className="border border-border rounded-input px-3 py-2
                         text-sm text-ink placeholder:text-ink-3
                         bg-surface resize-none
                         focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-ink-3
                              uppercase tracking-wide flex items-center
                              gap-1.5">
              <Tag size={12} />
              Tags
              <span className="text-ink-3 font-normal normal-case
                               tracking-normal">
                (comma-separated)
              </span>
            </label>
            <input
              value={tagsInput}
              onChange={(e) => { setTagsInput(e.target.value); markDirty(); }}
              placeholder="e.g. backend, phase2, auth"
              className="border border-border rounded-input px-3 py-2
                         text-sm text-ink placeholder:text-ink-3
                         bg-surface focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-brand"
            />
            {/* Live tag preview */}
            {tagsInput.trim() && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="bg-brand-light text-brand text-[11px]
                                 font-semibold px-2 py-0.5 rounded-pill"
                    >
                      {tag}
                    </span>
                  ))
                }
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <label className="text-[11px] font-semibold text-ink-3
                              uppercase tracking-wide flex items-center
                              gap-1.5">
              <Layers size={12} />
              Activity
            </label>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-ink-3">Created</span>
                <span className="text-ink-2 font-semibold">{createdAt}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-ink-3">Last updated</span>
                <span className="text-ink-2 font-semibold">{updatedAt}</span>
              </div>
              {task.assignee && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-ink-3">Assigned to</span>
                  <span className="text-ink-2 font-semibold">
                    {task.assignee}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Drawer footer — save button, only shows when dirty */}
        {isDirty && (
          <div className="border-t border-border p-4 flex flex-col
                          gap-2 flex-shrink-0">
            {saveError && (
              <p className="text-sm text-danger">{saveError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setDescription(task.description || '');
                  setTagsInput((task.tags || []).join(', '));
                  setAssignee(task.assignee || '');
                  setStatus(task.status || 'todo');
                  setIsDirty(false);
                  setSaveError('');
                }}
                className="border border-border text-ink-2 hover:bg-bg
                           rounded-input px-4 py-2 text-sm"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand text-white hover:bg-brand-dark
                           rounded-input px-4 py-2 text-sm font-semibold
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

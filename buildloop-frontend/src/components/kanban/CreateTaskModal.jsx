import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useUIStore from '@/store/uiStore.js';
import useProjectStore from '@/store/projectStore.js';
import apiClient from '@/api/client.js';

const TEAM_MEMBERS = ['Prableen', 'Jagjeevan', 'Eshaa', 'Arshdeep'];

const INITIAL_FORM = {
  title:       '',
  description: '',
  tags:        '',
  assignee:    '',
};

export default function CreateTaskModal() {
  const { activeModal, closeModal }     = useUIStore();
  const { activeProjectId }             = useProjectStore();
  const queryClient                     = useQueryClient();

  const [form, setForm]       = useState(INITIAL_FORM);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const isOpen = activeModal === 'createTask';

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  function handleClose() {
    setForm(INITIAL_FORM);
    setError('');
    setLoading(false);
    closeModal();
  }

  async function handleSubmit() {
    // Client-side validation
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!activeProjectId) {
      setError('No active project selected.');
      return;
    }

    // Parse comma-separated tags into a clean array
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/tasks', {
        title:       form.title.trim(),
        projectId:   activeProjectId,
        description: form.description.trim(),
        tags,
        assignee:    form.assignee || null,
      });

      // Invalidate tasks query so KanbanBoard refetches automatically
      await queryClient.invalidateQueries({
        queryKey: ['tasks', activeProjectId],
      });

      handleClose();
    } catch (err) {
      const message =
        err?.response?.data?.error || 'Failed to create task. Try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="bg-surface rounded-card border border-border
                   p-6 w-full max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-ink">
            New Task
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">

          {/* Title — required */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-2">
              Title <span className="text-danger">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Task title"
              className="border border-border rounded-input px-3 py-2
                         text-sm text-ink placeholder:text-ink-3
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-brand w-full bg-surface"
            />
          </div>

          {/* Description — optional */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-2">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional description"
              rows={3}
              className="border border-border rounded-input px-3 py-2
                         text-sm text-ink placeholder:text-ink-3
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-brand w-full bg-surface
                         resize-none"
            />
          </div>

          {/* Tags — optional, comma-separated */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-2">
              Tags
              <span className="text-ink-3 font-normal ml-1">
                (comma-separated)
              </span>
            </label>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g. backend, phase2, auth"
              className="border border-border rounded-input px-3 py-2
                         text-sm text-ink placeholder:text-ink-3
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-brand w-full bg-surface"
            />
          </div>

          {/* Assignee — optional select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-2">
              Assignee
            </label>
            <select
              name="assignee"
              value={form.assignee}
              onChange={handleChange}
              className="border border-border rounded-input px-3 py-2
                         text-sm text-ink focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-brand
                         w-full bg-surface"
            >
              <option value="">Unassigned</option>
              {TEAM_MEMBERS.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleClose}
              disabled={loading}
              className="border border-border text-ink-2 hover:bg-bg
                         rounded-input px-4 py-2 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.title.trim()}
              className="bg-brand text-white hover:bg-brand-dark
                         rounded-input px-4 py-2 text-sm font-semibold
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? 'Creating…' : 'Create Task'}
            </button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

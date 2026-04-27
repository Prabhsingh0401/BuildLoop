import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Info, Check, Loader2, Calendar, ListTodo, Circle, Layers } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import useUIStore from '@/store/uiStore.js';
import useProjectStore from '@/store/projectStore.js';
import apiClient from '@/api/client.js';

const INITIAL_FORM = {
  title: '',
  description: '',
  tags: '',
  assignee: '',
  featureId: '',
};

/** Fetch team members assigned to a specific project */
async function fetchProjectMembers(projectId) {
  const { data } = await apiClient.get(`/api/team-members?projectId=${projectId}`);
  return data.data ?? [];
}

export default function CreateTaskModal() {
  const { activeModal, closeModal } = useUIStore();
  const { activeProjectId } = useProjectStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('todo');

  const { data: features = [] } = useQuery({
    queryKey: ['features', activeProjectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/features/${activeProjectId}`);
      return data.features;
    },
    enabled: !!activeProjectId,
  });

  // Subtask state
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtaskList, setSubtaskList] = useState([]); // [{ id, title }]
  const subtaskRef = useRef(null);

  const isOpen = activeModal === 'createTask';

  /** Fetch team members for the active project */
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', activeProjectId],
    queryFn: () => fetchProjectMembers(activeProjectId),
    enabled: isOpen && !!activeProjectId,
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  function handleClose() {
    setForm(INITIAL_FORM);
    setError('');
    setLoading(false);
    setStatus('todo');
    setSubtaskInput('');
    setSubtaskList([]);
    closeModal();
  }

  /** Add a subtask to the local list (not yet saved) */
  function addSubtask() {
    const title = subtaskInput.trim();
    if (!title) return;
    setSubtaskList((prev) => [...prev, { id: crypto.randomUUID(), title }]);
    setSubtaskInput('');
    subtaskRef.current?.focus();
  }

  function removeSubtask(id) {
    setSubtaskList((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!activeProjectId) {
      setError('No active project selected.');
      return;
    }

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    setError('');

    // Auto-add any pending subtask text before submitting
    const finalSubtaskList = [...subtaskList];
    if (subtaskInput.trim()) {
      finalSubtaskList.push({ id: crypto.randomUUID(), title: subtaskInput.trim() });
    }

    try {
      // 1. Create the parent task
      const { data: taskData } = await apiClient.post('/api/tasks', {
        title:       form.title.trim(),
        projectId:   activeProjectId,
        description: form.description.trim(),
        tags,
        status,
        assignee: form.assignee || null,
        featureId: form.featureId || null,
      });

      const newTaskId = taskData.task._id;

      // 2. Create all subtasks in parallel and collect the returned objects
      if (finalSubtaskList.length > 0) {
        const results = await Promise.all(
          finalSubtaskList.map((s) =>
            apiClient.post(`/api/tasks/${newTaskId}/subtasks`, { title: s.title })
          )
        );

        // 3. Pre-populate the subtask cache so the drawer shows them instantly
        //    without a loading state or empty flash
        const createdSubtasks = results.map((r) => r.data.subtask);
        queryClient.setQueryData(['subtasks', newTaskId], createdSubtasks);
      } else {
        // Seed an empty list so the drawer doesn't show a spinner for a task with no subtasks
        queryClient.setQueryData(['subtasks', newTaskId], []);
      }

      await queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });

      handleClose();

    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to create task. Try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 md:p-6 !bg-transparent border-none shadow-none focus:outline-none max-w-none sm:max-w-none w-full h-full flex items-end md:items-center justify-center m-0 !translate-x-0 !translate-y-0 !top-0 !left-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Create New Task</DialogTitle>
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-[900px] h-auto max-h-[90vh] md:max-h-[85vh] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.1)] md:shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)] flex flex-col relative z-[110] border border-gray-100 rounded-t-3xl md:rounded-3xl overflow-hidden mt-auto md:m-auto"
        >
          {/* Handle for mobile pull-down (visual only) */}
          <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-gray-50/20">
            <div className="w-12 h-1.5 bg-black/10 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 md:px-8 py-5 md:py-6 flex items-start justify-between border-b border-gray-50 bg-gray-50/20">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Create New Task</h2>
              <p className="text-[13px] text-gray-400 font-medium">Add a new task to your project board</p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 md:py-6 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

                {/* ── Left Column ── */}
                <div className="space-y-6">
                  {/* Task Title */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Task Title</label>
                    <input
                      name="title"
                      type="text"
                      placeholder="What needs to be done?"
                      value={form.title}
                      onChange={handleChange}
                      className="w-full h-11 bg-white border border-gray-100 rounded-lg px-5 text-sm text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea
                      name="description"
                      placeholder="Add more details about this task..."
                      rows={4}
                      value={form.description}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-100 rounded-lg p-4 text-sm text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* ── Subtasks ── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <ListTodo size={13} />
                        Subtasks
                        {subtaskList.length > 0 && (
                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                            {subtaskList.length}
                          </span>
                        )}
                      </label>
                    </div>

                    {/* Saved subtask list */}
                    <AnimatePresence initial={false}>
                      {subtaskList.map((subtask) => (
                        <motion.div
                          key={subtask.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg group"
                        >
                          <Circle size={14} className="text-gray-300 flex-shrink-0" />
                          <span className="flex-1 text-sm text-gray-700 leading-snug">{subtask.title}</span>
                          <button
                            type="button"
                            onClick={() => removeSubtask(subtask.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-0.5 rounded"
                          >
                            <X size={13} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Inline add input */}
                    <div className="flex items-center gap-2">
                      <Circle size={14} className="text-gray-200 flex-shrink-0" />
                      <input
                        ref={subtaskRef}
                        type="text"
                        value={subtaskInput}
                        onChange={(e) => setSubtaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); // don't submit the form
                            addSubtask();
                          }
                        }}
                        placeholder="Add a subtask… (press Enter)"
                        className="flex-1 h-9 bg-white border border-gray-100 rounded-lg px-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-900/5 transition-all"
                      />
                      <button
                        type="button"
                        onClick={addSubtask}
                        disabled={!subtaskInput.trim()}
                        className="h-9 w-9 flex-shrink-0 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all disabled:opacity-30"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Right Column ── */}
                <div className="space-y-6">
                  {/* Status Selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                    <div className="bg-gray-50 p-1 rounded-lg flex items-center gap-1 border border-gray-100/50">
                      {['todo', 'in-progress', 'review', 'done'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`
                            flex-1 py-2.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.05em] transition-all duration-300
                            ${status === s
                              ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                              : 'text-gray-400 hover:text-gray-600'}
                          `}
                        >
                          {s.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Link to Feature */}
                  {features.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Layers size={12} />
                        Link to Feature
                      </label>
                      <select
                        name="featureId"
                        value={form.featureId}
                        onChange={handleChange}
                        className="w-full h-11 bg-white border border-gray-100 rounded-lg px-5 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none cursor-pointer appearance-none"
                      >
                        <option value="">No feature</option>
                        {features.map((f) => (
                          <option key={f._id} value={f._id}>{f.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Tags + Assignee */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tags</label>
                      <input
                        name="tags"
                        value={form.tags}
                        onChange={handleChange}
                        placeholder="e.g. urgent, feat"
                        className="w-full h-11 bg-white border border-gray-100 rounded-lg px-5 text-sm text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assignee</label>
                      <select
                        name="assignee"
                        value={form.assignee}
                        onChange={handleChange}
                        className="w-full h-11 bg-white border border-gray-100 rounded-lg px-5 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none cursor-pointer appearance-none"
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((member) => (
                          <option key={member._id} value={member.name || member.email}>
                            {member.name || member.email}
                            {member.role ? ` (${member.role})` : ''}
                          </option>
                        ))}
                        {teamMembers.length === 0 && (
                          <option disabled value="">No members assigned to this project</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Date Info */}
                  {/* Date */}
                  <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-lg flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Added On</span>
                      <span className="text-sm font-bold text-gray-900">
                        {new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <Calendar size={20} className="text-gray-300" />
                  </div>

                  {/* Subtask preview summary (right column) */}
                  {subtaskList.length > 0 && (
                    <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-lg space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                        {subtaskList.length} subtask{subtaskList.length !== 1 ? 's' : ''} queued
                      </span>
                      <div className="space-y-1.5">
                        {subtaskList.map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-xs text-gray-500">
                            <Circle size={10} className="text-gray-300 flex-shrink-0" />
                            <span className="truncate">{s.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center gap-3 p-4 bg-red-50/50 border border-red-100 rounded-lg"
                >
                  <Info size={16} className="text-red-500" />
                  <p className="text-[11px] text-red-600 font-bold uppercase tracking-tight">{error}</p>
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-5 md:px-8 py-5 md:py-6 border-t border-gray-50 bg-gray-50/20 flex items-center justify-between gap-4">
              <span className="text-xs text-gray-400">
                {subtaskList.length > 0
                  ? `${subtaskList.length} subtask${subtaskList.length !== 1 ? 's' : ''} will be created`
                  : ''}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 h-11 rounded-lg text-gray-500 font-bold text-sm bg-white border border-gray-100 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.title.trim()}
                  className="px-8 h-11 rounded-lg bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <Check size={18} strokeWidth={3} />
                      <span>
                        Create Task{subtaskList.length > 0 ? ` + ${subtaskList.length} subtask${subtaskList.length !== 1 ? 's' : ''}` : ''}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

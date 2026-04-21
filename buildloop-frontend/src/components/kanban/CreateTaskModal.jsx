import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, X, Tag, User, AlignLeft, Info, Check, Loader2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import useUIStore from '@/store/uiStore.js';
import useProjectStore from '@/store/projectStore.js';
import apiClient from '@/api/client.js';

const TEAM_MEMBERS = ['Prableen', 'Jagjeevan', 'Eshaa', 'Arshdeep'];

const INITIAL_FORM = {
  title: '',
  description: '',
  tags: '',
  assignee: '',
};

export default function CreateTaskModal() {
  const { activeModal, closeModal } = useUIStore();
  const { activeProjectId } = useProjectStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('todo');

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
    setStatus('todo');
    closeModal();
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

    try {
      await apiClient.post('/api/tasks', {
        title: form.title.trim(),
        projectId: activeProjectId,
        description: form.description.trim(),
        tags,
        status,
        assignee: form.assignee || null,
      });

      await queryClient.invalidateQueries({
        queryKey: ['tasks', activeProjectId],
      });

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
        className="p-0 !bg-transparent border-none shadow-none focus:outline-none max-w-none sm:max-w-none w-full h-full flex items-center justify-center m-0 md:p-6 !translate-x-0 !translate-y-0 !top-0 !left-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Create New Task</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-[850px] h-auto max-h-[90vh] bg-white shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)] flex flex-col relative z-[110] border border-gray-100 rounded-xl overflow-hidden m-auto"
        >
          {/* Header */}
          <div className="px-8 py-6 flex items-start justify-between border-b border-gray-50 bg-gray-50/20">
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
            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Task Name */}
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
                      rows={5}
                      value={form.description}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-100 rounded-lg p-4 text-sm text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Right Column */}
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

                  {/* Categorization & Assignment */}
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
                        {TEAM_MEMBERS.map((member) => (
                          <option key={member} value={member}>{member}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date Info (Simplified) */}
                  <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-lg flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Added On</span>
                      <span className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <Calendar size={20} className="text-gray-300" />
                  </div>
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

            {/* Actions */}
            <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/20 flex items-center justify-end gap-4">
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
                    <span>Create Task</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

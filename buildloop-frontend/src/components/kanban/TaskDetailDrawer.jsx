import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  X,
  Calendar,
  User,
  Tag,
  Trash2,
  CheckCircle2,
  Hash,
  ClipboardList,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Check,
  Plus,
  ListTodo,
  Circle,
  Pencil,
} from 'lucide-react';
import apiClient from '@/api/client.js';
import useProjectStore from '@/store/projectStore.js';
import ConfirmModal from '@/components/ui/ConfirmModal.jsx';

/* ─── Subtask Item ─────────────────────────────────────────────── */
function SubtaskItem({ subtask, onToggle, onDelete }) {
  const isDone = subtask.status === 'done';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-3 group py-2 px-3 rounded-lg hover:bg-gray-50 transition-all"
    >
      <button
        onClick={() => onToggle(subtask)}
        className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
      >
        {isDone ? (
          <CheckCircle2 size={17} className="text-emerald-500" strokeWidth={2} />
        ) : (
          <Circle size={17} className="text-gray-300 hover:text-gray-500" strokeWidth={2} />
        )}
      </button>

      <span
        className={`flex-1 text-sm leading-snug transition-all ${
          isDone ? 'line-through text-gray-400' : 'text-gray-700'
        }`}
      >
        {subtask.title}
      </span>

      <button
        onClick={() => onDelete(subtask._id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-400 rounded"
      >
        <Trash2 size={13} />
      </button>
    </motion.div>
  );
}

/* ─── Main Drawer ──────────────────────────────────────────────── */
export default function TaskDetailDrawer({ task, onClose, featureName, onTaskUpdated }) {
  const { activeProjectId } = useProjectStore();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || '');
  const [editedDescription, setEditedDescription] = useState(task?.description || '');
  const [editedAssignee, setEditedAssignee] = useState(task?.assignee || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Subtask state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const subtaskInputRef = useRef(null);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || '');
      setEditedAssignee(task.assignee || '');
      setIsEditing(false);
      setNewSubtaskTitle('');
      setAddingSubtask(false);
    }
  }, [task?._id]);

  /* ── Fetch subtasks ── */
  const { data: subtasksData, isLoading: subtasksLoading } = useQuery({
    queryKey: ['subtasks', task?._id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/tasks/${task._id}/subtasks`);
      return data.subtasks ?? [];
    },
    enabled: !!task?._id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const subtasks = subtasksData ?? [];

  const doneCount = subtasks.filter((s) => s.status === 'done').length;
  const progress  = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', activeProjectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/team-members?projectId=${activeProjectId}`);
      return data.data ?? [];
    },
    enabled: !!task && !!activeProjectId,
  });

  const SUBTASK_KEY = ['subtasks', task?._id];

  /* ── Task mutations ── */
  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      const { data } = await apiClient.patch(`/api/tasks/${task._id}`, updates);
      return data.task;
    },
    onSuccess: (updated) => {
      // Immediately patch the task inside the board cache so the card updates too
      queryClient.setQueryData(['tasks', activeProjectId], (old) =>
        old ? old.map((t) => (t._id === updated._id ? updated : t)) : old
      );
      setIsEditing(false);
      if (onTaskUpdated) onTaskUpdated(updated);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/tasks/${task._id}`);
    },
    onSuccess: () => {
      queryClient.setQueryData(['tasks', activeProjectId], (old) =>
        old ? old.filter((t) => t._id !== task._id) : old
      );
      onClose();
    },
  });

  /* ── Subtask mutations ── */
  const addSubtaskMutation = useMutation({
    mutationFn: async (title) => {
      const { data } = await apiClient.post(`/api/tasks/${task._id}/subtasks`, { title });
      return data.subtask;
    },
    onSuccess: (newSubtask) => {
      // Directly append the new subtask into the cache → instant render
      queryClient.setQueryData(SUBTASK_KEY, (old) => [...(old ?? []), newSubtask]);
      setNewSubtaskTitle('');
      subtaskInputRef.current?.focus();
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async (subtask) => {
      const newStatus = subtask.status === 'done' ? 'todo' : 'done';
      const { data } = await apiClient.patch(`/api/tasks/${subtask._id}`, { status: newStatus });
      return data.task;
    },
    onSuccess: (updated) => {
      // Flip the status in cache immediately
      queryClient.setQueryData(SUBTASK_KEY, (old) =>
        old ? old.map((s) => (s._id === updated._id ? updated : s)) : old
      );
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (subtaskId) => {
      await apiClient.delete(`/api/tasks/${subtaskId}`);
      return subtaskId;
    },
    onSuccess: (deletedId) => {
      // Remove from cache immediately
      queryClient.setQueryData(SUBTASK_KEY, (old) =>
        old ? old.filter((s) => s._id !== deletedId) : old
      );
    },
  });

  if (!task) return null;

  const handleSave = () => {
    updateMutation.mutate({ 
      title: editedTitle, 
      description: editedDescription, 
      assignee: editedAssignee || null
    });
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    deleteMutation.mutate();
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleAddSubtask = (e) => {
    e?.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtaskMutation.mutate(newSubtaskTitle.trim());
  };

  return (<>
    <Dialog open={!!task} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 md:p-6 !bg-transparent border-none shadow-none focus:outline-none max-w-none sm:max-w-none w-full h-full flex items-end md:items-center justify-center m-0 !translate-x-0 !translate-y-0 !top-0 !left-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Task Details</DialogTitle>
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-[900px] h-auto max-h-[90vh] md:max-h-[85vh] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.1)] md:shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)] flex flex-col relative z-[110] border border-gray-100 rounded-t-3xl md:rounded-3xl overflow-hidden mt-auto md:m-auto"
        >
          {/* Handle for mobile pull-down (visual only) */}
          <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-gray-50/30">
            <div className="w-12 h-1.5 bg-black/10 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 md:px-8 py-5 md:py-6 border-b border-gray-50 flex-shrink-0 bg-gray-50/30">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-semibold uppercase tracking-wider">
                {task.status.replace('-', ' ')}
              </span>
              {featureName && featureName.toLowerCase() !== task.title.toLowerCase() && (
                <span className="px-3 py-1.5 rounded-full bg-white border border-gray-100 text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
                  {featureName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Edit toggle button */}
              <button
                onClick={() => setIsEditing((v) => !v)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                  isEditing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-white border border-gray-100 text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
                title={isEditing ? "Cancel Edit" : "Edit Task"}
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Multi-column Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

              {/* ── Left Column (Main) ── */}
              <div className="lg:col-span-7 p-5 md:p-8 space-y-8 border-r border-gray-50">

                {/* Title */}
                <div className="space-y-3">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-3xl font-semibold text-gray-900 tracking-tight leading-tight w-full bg-transparent border-b border-gray-200 focus:outline-none focus:border-gray-900 pb-2"
                    />
                  ) : (
                    <h2
                      className="text-3xl font-semibold text-gray-900 tracking-tight leading-tight cursor-pointer hover:text-gray-700"
                      onClick={() => setIsEditing(true)}
                    >
                      {task.title}
                    </h2>
                  )}
                  <div className="flex items-center gap-6 text-[13px] text-gray-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-300" />
                      <span>{new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList size={16} />
                    Description
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={4}
                      className="w-full bg-gray-50/50 p-4 rounded-lg border border-gray-100 text-gray-600 leading-relaxed text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 resize-none"
                      placeholder="Add more details..."
                    />
                  ) : (
                    <p
                      className="text-gray-600 leading-relaxed text-sm bg-gray-50/50 p-4 rounded-lg border border-gray-50 cursor-pointer"
                      onClick={() => setIsEditing(true)}
                    >
                      {task.description || 'No additional context provided.'}
                    </p>
                  )}
                </div>

                {/* ── Subtasks ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <ListTodo size={16} />
                      Subtasks
                      {subtasks.length > 0 && (
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {doneCount}/{subtasks.length}
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={() => {
                        setAddingSubtask(true);
                        setTimeout(() => subtaskInputRef.current?.focus(), 50);
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-all"
                    >
                      <Plus size={13} />
                      Add
                    </button>
                  </div>



                  {/* Subtask list */}
                  <div className="space-y-0.5 -mx-3">
                    {subtasksLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 size={16} className="animate-spin text-gray-300" />
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {subtasks.map((subtask) => (
                          <SubtaskItem
                            key={subtask._id}
                            subtask={subtask}
                            onToggle={(s) => toggleSubtaskMutation.mutate(s)}
                            onDelete={(id) => deleteSubtaskMutation.mutate(id)}
                          />
                        ))}
                      </AnimatePresence>
                    )}

                    {subtasks.length === 0 && !addingSubtask && !subtasksLoading && (
                      <button
                        onClick={() => {
                          setAddingSubtask(true);
                          setTimeout(() => subtaskInputRef.current?.focus(), 50);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-lg transition-all border border-dashed border-gray-200 hover:border-gray-300"
                      >
                        <Plus size={14} />
                        Add a subtask…
                      </button>
                    )}
                  </div>

                  {/* Inline add subtask input */}
                  <AnimatePresence>
                    {addingSubtask && (
                      <motion.form
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        onSubmit={handleAddSubtask}
                        className="flex items-center gap-2 mt-1"
                      >
                        <div className="flex-shrink-0">
                          <Circle size={17} className="text-gray-200" />
                        </div>
                        <input
                          ref={subtaskInputRef}
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          placeholder="Subtask title…"
                          className="flex-1 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/5 transition-all placeholder:text-gray-300"
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setAddingSubtask(false);
                              setNewSubtaskTitle('');
                            }
                          }}
                        />
                        <button
                          type="submit"
                          disabled={addSubtaskMutation.isPending || !newSubtaskTitle.trim()}
                          className="h-9 w-9 flex-shrink-0 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-all disabled:opacity-40"
                        >
                          {addSubtaskMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} strokeWidth={2.5} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingSubtask(false);
                            setNewSubtaskTitle('');
                          }}
                          className="h-9 w-9 flex-shrink-0 rounded-lg border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-50 hover:text-gray-700 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                {/* Task History */}
                <div className="space-y-4">
                  <div className="border-b border-gray-50 pb-3">
                    <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <ExternalLink size={16} />
                      Task History
                    </h3>
                  </div>
                  <div className="space-y-4 relative ml-3">
                    <div className="absolute left-[-13px] top-2 bottom-2 w-px bg-gray-100" />
                    <div className="flex flex-col gap-1 relative">
                      <div className="absolute left-[-18px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-gray-900 shadow-sm" />
                      <span className="text-sm font-medium text-gray-900">Task Created</span>
                      <span className="text-[11px] text-gray-400">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right Column (Sidebar) ── */}
              <div className="lg:col-span-5 p-5 md:p-8 bg-gray-50/20 space-y-6">
                {/* Metadata Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-white border border-gray-100">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Task ID</span>
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-gray-900" />
                      <span className="font-medium text-gray-900 text-sm">{task._id.slice(-8).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-gray-100">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Priority</span>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-gray-900" />
                      <span className="font-medium text-gray-900 text-sm">Standard</span>
                    </div>
                  </div>
                </div>



                {/* Assignee */}
                <div className="space-y-3">
                  <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <User size={16} />
                    Assigned To
                  </div>
                  {isEditing ? (
                    <select
                      value={editedAssignee}
                      onChange={(e) => setEditedAssignee(e.target.value)}
                      className="w-full h-11 bg-white border border-gray-100 rounded-lg px-4 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all outline-none cursor-pointer appearance-none"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((member) => (
                        <option key={member._id} value={member.name || member.email}>
                          {member.name || member.email}
                          {member.role ? ` (${member.role})` : ''}
                        </option>
                      ))}
                      {teamMembers.length === 0 && (
                        <option disabled value="">No members assigned</option>
                      )}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-xs shrink-0 uppercase">
                        {(task.assignee || 'U')[0]}
                      </div>
                      <span className="font-medium text-gray-900 text-sm truncate">{task.assignee || 'Unassigned'}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Tag size={16} />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(task.tags || []).length === 0 ? (
                      <span className="text-sm text-gray-300">No tags</span>
                    ) : (
                      (task.tags || []).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-md bg-white border border-gray-100 text-gray-700 text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 md:px-8 py-4 md:py-5 border-t border-gray-50 flex items-center justify-end gap-4 bg-white shrink-0">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 h-11 rounded-lg border border-red-100 text-red-500 font-medium text-sm hover:bg-red-50 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              Delete
            </button>

            {isEditing && (
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-8 h-11 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Save Changes
              </button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>

    <ConfirmModal
      open={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      onConfirm={confirmDelete}
      loading={isDeleting}
      title="Delete this task?"
      description="This will permanently delete the task and all its subtasks. This action cannot be undone."
      confirmLabel="Delete Task"
    />
  </>);
}
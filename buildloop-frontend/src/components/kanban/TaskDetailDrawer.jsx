import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
  Check
} from 'lucide-react';
import apiClient from '@/api/client.js';
import useProjectStore from '@/store/projectStore.js';

export default function TaskDetailDrawer({ task, onClose, featureName }) {
  const { activeProjectId } = useProjectStore();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || '');
  const [editedDescription, setEditedDescription] = useState(task?.description || '');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description || '');
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      const { data } = await apiClient.patch(`/api/tasks/${task._id}`, updates);
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/tasks/${task._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeProjectId] });
      onClose();
    },
  });

  if (!task) return null;

  const handleSave = () => {
    updateMutation.mutate({
      title: editedTitle,
      description: editedDescription,
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      deleteMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 !bg-transparent border-none shadow-none focus:outline-none max-w-none sm:max-w-none w-full h-full flex items-center justify-center m-0 md:p-6 !translate-x-0 !translate-y-0 !top-0 !left-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Task Details</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-[900px] h-auto max-h-[90vh] bg-white shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)] flex flex-col relative z-[110] border border-gray-100 rounded-xl overflow-hidden m-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 flex-shrink-0 bg-gray-50/30">
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-semibold uppercase tracking-wider">
                {task.status.replace('-', ' ')}
              </span>
              {featureName && (
                <span className="px-3 py-1.5 rounded-full bg-white border border-gray-100 text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
                  {featureName}
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>

          {/* Multi-column Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

              {/* Main Content (Left Column) */}
              <div className="lg:col-span-7 p-8 space-y-8 border-r border-gray-50">
                {/* Title Area */}
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
                      rows={5}
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

                {/* Timeline */}
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

              {/* Sidebar (Right Column) */}
              <div className="lg:col-span-5 p-8 bg-gray-50/20 space-y-6">
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
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-xs">
                      {(task.assignee || 'U')[0]}
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{task.assignee || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Tag size={16} />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(task.tags || []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-md bg-white border border-gray-100 text-gray-700 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-50 flex items-center justify-end gap-4 bg-white shrink-0">
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
  );
}
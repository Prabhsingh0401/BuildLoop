import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderKanban, Loader2, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import useProjectStore from '../../store/projectStore';
import { createProject } from '../../services/projectService';

export default function CreateProjectModal() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { isCreateModalOpen, setCreateModalOpen, setActiveProject } = useProjectStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      return createProject(payload.name, payload.description, token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setActiveProject(res.data._id, 'owner');
      toast.success('Project created successfully!');
      handleClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create project');
    },
  });

  const handleClose = () => {
    setCreateModalOpen(false);
    setName('');
    setDescription('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() });
  };

  return (
    <AnimatePresence>
      {isCreateModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[20px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-8 pt-8 pb-6">
                <button
                  onClick={handleClose}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-[#1a1d23] flex items-center justify-center mb-6 shadow-lg shadow-black/10">
                  <FolderKanban className="w-7 h-7 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create New Project</h2>
                <p className="text-gray-500 mt-1.5 text-[15px]">Build something amazing today.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="project-name" className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Project Name
                  </label>
                  <input
                    id="project-name"
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Acme Dashboard"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#1a1d23] focus:ring-4 focus:ring-black/[0.03] transition-all placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="project-desc" className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="project-desc"
                    placeholder="What's this project about?"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#1a1d23] focus:ring-4 focus:ring-black/[0.03] transition-all placeholder:text-gray-400 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !name.trim()}
                    className="w-full flex items-center justify-center gap-2 h-14 bg-[#1a1d23] hover:bg-black text-white rounded-2xl font-semibold shadow-lg shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Create Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

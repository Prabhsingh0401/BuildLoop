import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, FolderKanban, Check, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import useProjectStore from '../../store/projectStore';
import { fetchProjects, createProject } from '../../services/projectService';

export default function ProjectSelector({ iconOnly = false }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { activeProjectId, setActiveProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = await getToken();
      return fetchProjects(token);
    },
    enabled: isLoaded && isSignedIn,
  });

  const projects = projectsData?.data || [];

  const activeProject = activeProjectId 
    ? projects.find(p => p._id === activeProjectId)
    : projects[0];

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      const first = projects[0];
      setActiveProject(first._id, first.isOwner ? 'owner' : 'member');
    }
  }, [projects, activeProjectId, setActiveProject]);

  const createMutation = useMutation({
    mutationFn: async (name) => {
      const token = await getToken();
      return createProject(name, '', token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setActiveProject(res.data._id, 'owner');
      setIsCreating(false);
      setNewProjectName('');
      setIsOpen(false);
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    createMutation.mutate(newProjectName);
  };

  if (!isSignedIn) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={iconOnly 
          ? 'p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all relative'
          : 'flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-black/[0.04] rounded-full hover:bg-white hover:shadow-md transition-all active:scale-95'
        }
      >
        <FolderKanban className={iconOnly ? 'w-5 h-4' : 'w-5 h-5 text-ink-3'} />
        {!iconOnly && (
          <>
            <span className="text-sm text-gray-600 max-w-[140px] truncate">
              {isLoading ? 'Loading...' : (activeProject?.name || 'Select Project')}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[60]"
          >
            <div className="p-2 max-h-[300px] overflow-y-auto no-scrollbar">
              <div className="px-2 py-1.5 mb-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Your Projects</span>
              </div>
              
              {projects.length === 0 && !isLoading && (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">No projects yet</div>
              )}

              {projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => {
                    setActiveProject(project._id, project.isOwner ? 'owner' : 'member');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                    activeProjectId === project._id ? 'bg-gray-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="truncate pr-2">{project.name}</span>
                  {activeProjectId === project._id && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                </button>
              ))}

              <div className="h-px bg-gray-100 my-2" />

              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-brand hover:bg-brand/5 transition-colors text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Create New Project
                </button>
              ) : (
                <form onSubmit={handleCreate} className="px-2 py-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Project name..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="flex-1 px-2 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || !newProjectName.trim()}
                      className="flex-1 flex justify-center items-center px-2 py-1.5 text-xs font-semibold text-white bg-black hover:bg-gray-800 rounded-md disabled:opacity-50"
                    >
                      {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile closing */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}

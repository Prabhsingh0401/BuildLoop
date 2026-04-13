import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { fetchProjects } from '../services/projectService';
import { FolderKanban, Plus, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const SkeletonCard = () => (
  <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '200%' }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none"
    />
    
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-gray-100/80 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100/80 rounded-full w-3/4 animate-pulse" />
        <div className="h-2 bg-gray-100/80 rounded-full w-1/2 animate-pulse" />
      </div>
    </div>
    
    <div className="space-y-3">
      <div className="h-2 bg-gray-100/80 rounded-full w-full animate-pulse" />
      <div className="h-2 bg-gray-100/80 rounded-full w-[90%] animate-pulse" />
      <div className="h-2 bg-gray-100/80 rounded-full w-4/5 animate-pulse" />
    </div>
    
    <div className="mt-8 flex justify-between gap-3">
      <div className="h-8 bg-gray-100/80 rounded-xl w-24 animate-pulse" />
      <div className="h-8 bg-gray-100/80 rounded-xl w-24 animate-pulse" />
    </div>
  </div>
);

const ProjectCard = ({ project, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
  >
    <NavLink
      to="/feedback"
      className="block bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/80 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/60 border border-white/40 flex items-center justify-center">
          <FolderKanban className="w-6 h-6 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {project.name}
          </h3>
          <p className="text-sm text-gray-500">
            {project.description || 'No description'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-gray-100/80 rounded-full text-xs font-medium text-gray-600">
            Active
          </span>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" />
      </div>
    </NavLink>
  </motion.div>
);

export default function Dashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = await getToken();
      return fetchProjects(token);
    },
    enabled: isLoaded && isSignedIn,
  });

  const projects = data?.data || [];

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-4">
      <div 
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />
      
      <div className="z-10 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Your Projects</h1>
          <p className="text-gray-500">
            {isLoading ? (
              'Loading...'
            ) : (
              `You have ${projects.length} project${projects.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <SkeletonCard />
              </motion.div>
            ))
          ) : projects.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <FolderKanban className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Create your first project to get started</p>
              <NavLink
                to="/feedback"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1d23] hover:bg-black text-white rounded-full text-sm font-semibold transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </NavLink>
            </div>
          ) : (
            projects.map((project, index) => (
              <ProjectCard key={project._id} project={project} index={index} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

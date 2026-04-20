import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { fetchProjects } from '../services/projectService';
import {
  fetchTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../services/teamService';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Users,
  X,
  Trash2,
  Pencil,
  Check,
  ChevronDown,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

/* ─────────────────────────────────────────── */
/* Role options & colors                       */
/* ─────────────────────────────────────────── */
const ROLES = [
  { value: 'Developer', label: 'Developer' },
  { value: 'Designer', label: 'Designer' },
  { value: 'QA Engineer', label: 'QA Engineer' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Product Manager', label: 'Product Manager' },
  { value: 'Analyst', label: 'Analyst' },
  { value: 'Other', label: 'Other' },
];

const roleColor = (role) => {
  const map = {
    Developer: 'bg-blue-50 text-blue-700 border-blue-100',
    Designer: 'bg-purple-50 text-purple-700 border-purple-100',
    'QA Engineer': 'bg-yellow-50 text-yellow-700 border-yellow-100',
    DevOps: 'bg-orange-50 text-orange-700 border-orange-100',
    'Product Manager': 'bg-green-50 text-green-700 border-green-100',
    Analyst: 'bg-teal-50 text-teal-700 border-teal-100',
  };
  return map[role] || 'bg-gray-50 text-gray-600 border-gray-100';
};

/* ─────────────────────────────────────────── */
/* Skeleton card                               */
/* ─────────────────────────────────────────── */
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
    </div>
    <div className="mt-6 h-8 bg-gray-100/80 rounded-xl w-32 animate-pulse" />
  </div>
);

/* ─────────────────────────────────────────── */
/* Project Card                                */
/* ─────────────────────────────────────────── */
const ProjectCard = ({ project, index, onManageTeam }) => {
  const isOwner = project.isOwner;
  const devRole = project.role; // only set when isAssigned

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="flex flex-col"
    >
      <NavLink
        to="/feedback"
        className="flex-1 block bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/80 hover:shadow-lg transition-all duration-300 group"
      >
        {/* Card top */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/60 border border-white/40 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{project.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">
              {project.description || 'No description'}
            </p>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100/80 rounded-full text-xs font-medium text-gray-600">
              Active
            </span>
            {/* Developer badge for assigned projects */}
            {!isOwner && devRole && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColor(devRole)}`}>
                {devRole}
              </span>
            )}
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" />
        </div>
      </NavLink>

      {/* Add Member button — only for projects the user owns */}
      {isOwner && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManageTeam(project);
          }}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-white/70 hover:bg-white backdrop-blur-sm border border-white/50 shadow-sm hover:shadow-md rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 transition-all active:scale-[0.98]"
        >
          <Users className="w-3.5 h-3.5" />
          Add Member
        </button>
      )}
    </motion.div>
  );
};

/* ─────────────────────────────────────────── */
/* Team Members Dialog (project-scoped)        */
/* ─────────────────────────────────────────── */
function TeamMembersDialog({ project, onClose, token }) {
  const queryClient = useQueryClient();
  const open = !!project;

  // Add form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');
  const [name, setName] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editName, setEditName] = useState('');

  // Reset form when project changes
  useEffect(() => {
    setEmail('');
    setRole('Developer');
    setName('');
    setEditingId(null);
  }, [project?._id]);

  /* ── Fetch members for this project ── */
  const { data, isLoading } = useQuery({
    queryKey: ['teamMembers', project?._id],
    queryFn: () => fetchTeamMembers(project._id, token),
    enabled: open && !!token && !!project?._id,
  });
  const members = data?.data || [];

  /* ── Add ── */
  const addMutation = useMutation({
    mutationFn: (payload) => addTeamMember(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', project?._id] });
      setEmail('');
      setName('');
      setRole('Developer');
      toast.success('Member added to project!');
    },
    onError: (err) => toast.error(err.message),
  });

  /* ── Update ── */
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTeamMember(id, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', project?._id] });
      setEditingId(null);
      toast.success('Member updated');
    },
    onError: (err) => toast.error(err.message),
  });

  /* ── Delete ── */
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTeamMember(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', project?._id] });
      toast.success('Member removed from project');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!email.trim() || !project?._id) return;
    addMutation.mutate({ email: email.trim(), role, name: name.trim(), projectId: project._id });
  };

  const startEdit = (member) => {
    setEditingId(member._id);
    setEditRole(member.role);
    setEditName(member.name || '');
  };

  const saveEdit = (id) =>
    updateMutation.mutate({ id, payload: { role: editRole, name: editName } });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[50] bg-black/20 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[51] flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.12)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1d23]/5 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#1a1d23]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">
                      {project?.name}
                    </p>
                  </div>
                </div>
                <button
                  id="team-dialog-close"
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add form */}
              <form onSubmit={handleAdd} className="px-6 py-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Add member to this project
                </p>
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      id="team-member-email"
                      type="email"
                      required
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a1d23] focus:ring-1 focus:ring-[#1a1d23]/20 placeholder:text-gray-400 transition-all"
                    />
                    <input
                      id="team-member-name"
                      type="text"
                      placeholder="Name (optional)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-36 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a1d23] focus:ring-1 focus:ring-[#1a1d23]/20 placeholder:text-gray-400 transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        id="team-member-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full appearance-none px-3.5 py-2.5 pr-9 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a1d23] focus:ring-1 focus:ring-[#1a1d23]/20 transition-all"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>

                    <button
                      id="team-member-add-btn"
                      type="submit"
                      disabled={addMutation.isPending || !email.trim()}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a1d23] hover:bg-black text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
                    >
                      {addMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Member list */}
              <div className="px-6 py-3 max-h-64 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Users className="w-8 h-8 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">No members assigned yet</p>
                    <p className="text-xs text-gray-300 mt-1">Add a team member above</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-1">
                    {members.map((member) => (
                      <motion.div
                        key={member._id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-3 px-3 py-2.5 bg-gray-50/80 hover:bg-gray-100/60 border border-gray-100 rounded-xl transition-all group"
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-[#1a1d23]/[0.06] flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-semibold text-gray-600">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {editingId === member._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Name"
                                className="w-24 px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1d23]"
                              />
                              <div className="relative">
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  className="appearance-none px-2 py-1 pr-6 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1d23]"
                                >
                                  {ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>
                                      {r.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs font-semibold text-gray-800 truncate">
                                {member.name || member.email}
                              </p>
                              {member.name && (
                                <p className="text-[11px] text-gray-400 truncate">{member.email}</p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Controls */}
                        {editingId === member._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => saveEdit(member._id)}
                              disabled={updateMutation.isPending}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${roleColor(member.role)}`}
                            >
                              {member.role}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(member)}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(member._id)}
                                disabled={deleteMutation.isPending}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                title="Remove"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {members.length > 0
                      ? `${members.length} member${members.length !== 1 ? 's' : ''} assigned · `
                      : ''}
                    Members can sign in with Google and will see this project in their dashboard.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────── */
/* Dashboard                                   */
/* ─────────────────────────────────────────── */
export default function Dashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [token, setToken] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null); // project object for dialog

  // Pre-fetch token
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getToken().then(setToken);
    }
  }, [isLoaded, isSignedIn, getToken]);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const t = await getToken();
      setToken(t);
      return fetchProjects(t);
    },
    enabled: isLoaded && isSignedIn,
  });

  const projects = data?.data || [];
  const ownedProjects = projects.filter((p) => p.isOwner);
  const assignedProjects = projects.filter((p) => p.isAssigned);

  const handleOpenTeamDialog = async (project) => {
    if (!token) {
      const t = await getToken();
      setToken(t);
    }
    setSelectedProject(project);
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-4">
      {/* background grid */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="z-10 w-full max-w-7xl mx-auto">

        {/* ── My Projects (PM view) ── */}
        <div className="mb-10">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Your Projects</h1>
            <p className="text-gray-500 text-sm">
              {isLoading
                ? 'Loading…'
                : `${ownedProjects.length} project${ownedProjects.length !== 1 ? 's' : ''} you manage`}
            </p>
          </div>

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
            ) : ownedProjects.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <FolderKanban className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-6 text-sm">Create your first project to get started</p>
                <NavLink
                  to="/feedback"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1d23] hover:bg-black text-white rounded-full text-sm font-semibold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Project
                </NavLink>
              </div>
            ) : (
              ownedProjects.map((project, index) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  index={index}
                  onManageTeam={handleOpenTeamDialog}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Assigned Projects (Developer view) ── */}
        {!isLoading && assignedProjects.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Assigned to You</h2>
              <p className="text-gray-500 text-sm">
                Projects where you've been added as a team member
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedProjects.map((project, index) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  index={index}
                  onManageTeam={handleOpenTeamDialog}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Team dialog — opens per-project */}
      <TeamMembersDialog
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        token={token}
      />
    </div>
  );
}

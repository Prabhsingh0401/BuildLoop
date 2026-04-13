import { motion , AnimatePresence} from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, useUser, useClerk } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Lightbulb, 
  ListChecks, 
  KanbanSquare, 
  Code2,
  Bell,
  ChevronDown,
  LogOut,
  X,
  Menu,
  Plus,
  Loader2,
  FolderKanban
} from 'lucide-react';
import { useState } from 'react';
import ProjectSelector from './ProjectSelector';
import useProjectStore from '../../store/projectStore';
import { fetchProjects, createProject } from '../../services/projectService';

const NAV_ITEMS = [
  { name: 'Dashboard', route: '/', icon: LayoutDashboard },
  { name: 'Feedback', route: '/feedback', icon: MessageSquare },
  { name: 'Insights', route: '/insights', icon: Lightbulb },
  { name: 'Features', route: '/features', icon: ListChecks },
  { name: 'Kanban', route: '/kanban', icon: KanbanSquare },
  { name: 'Workspace', route: '/workspace', icon: Code2 },
];

const LOGO_URL = '/buildloop_logo_black.png';

export default function Navbar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileCreateOpen, setMobileCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = await getToken();
      return fetchProjects(token);
    },
  });

  const projects = projectsData?.data || [];
  const activeProject = activeProjectId 
    ? projects.find(p => p._id === activeProjectId)
    : projects[0];

  const createMutation = useMutation({
    mutationFn: async (name) => {
      const token = await getToken();
      return createProject(name, '', token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setActiveProjectId(res.data._id);
      setMobileCreateOpen(false);
      setNewProjectName('');
    },
  });

  return (
    <>
      {/* Desktop Navbar - Large screens only */}
      <header className="fixed top-6 left-0 right-0 z-50 hidden lg:flex justify-center px-6">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-7xl h-16 bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full flex items-center justify-between px-6 ring-1 ring-black/[0.02]"
        >
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2">
              <img src={LOGO_URL} alt="BuildLoop" className="h-8 w-auto" />
            </NavLink>
            
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar relative min-h-[44px]">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.route}
                  className={({ isActive }) => `
                    relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 flex items-center gap-2 whitespace-nowrap z-10
                    ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-900'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-[#1a1d23] rounded-full -z-10 shadow-lg shadow-black/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-2">
            <SignedIn>
              <ProjectSelector iconOnly />
            </SignedIn>

            <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all relative group">
              <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="pl-2 border-l border-gray-100 ml-1">
              <SignedIn>
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 p-1 pr-3 hover:bg-gray-50 rounded-full transition-all border border-transparent hover:border-gray-100 group"
                  >
                    <div className="relative">
                      <img 
                        src={user?.imageUrl} 
                        alt="" 
                        className="w-9 h-9 rounded-full border border-gray-200 shadow-sm transition-transform group-hover:scale-105"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-gray-900 leading-none">{user?.firstName || 'User'}</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 max-w-[100px] truncate leading-none">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-[60]"
                    >
                      <div className="px-3 py-2.5 border-b border-gray-50 mb-1">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Account</p>
                      </div>
                      <button
                        onClick={() => {
                          signOut({ redirectUrl: '/' });
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-500 hover:bg-red-50/50 rounded-xl transition-colors text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-5 py-2 bg-[#1a1d23] hover:bg-black text-white rounded-full text-sm font-semibold transition-all shadow-md active:scale-95">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Tablet Navbar - md to lg */}
      <header className="fixed top-6 left-0 right-0 z-50 hidden md:flex lg:hidden justify-center px-4">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl h-14 bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full flex items-center justify-between px-4 ring-1 ring-black/[0.02]"
        >
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-2">
              <img src={LOGO_URL} alt="BuildLoop" className="h-7 w-auto" />
            </NavLink>
            
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar relative min-h-[40px]">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.route}
                  className={({ isActive }) => `
                    relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 flex items-center gap-2 whitespace-nowrap z-10
                    ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-900'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="w-4 h-4" />
                      <span className="nav-text">{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill-tablet"
                          className="absolute inset-0 bg-[#1a1d23] rounded-full -z-10 shadow-lg shadow-black/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-2">
            <SignedIn>
              <ProjectSelector iconOnly />
            </SignedIn>

            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all relative group">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>

            <div className="pl-1 border-l border-gray-100 ml-1">
              <SignedIn>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-full transition-all"
                >
                  <img 
                    src={user?.imageUrl} 
                    alt="" 
                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                  />
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-1.5 bg-[#1a1d23] hover:bg-black text-white rounded-full text-sm font-semibold transition-all shadow-md">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Mobile Header - Below md */}
      <header className="fixed top-4 left-4 right-4 z-50 flex md:hidden justify-between items-center">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full flex items-center px-3 py-2 ring-1 ring-black/[0.02]"
        >
          <img src={LOGO_URL} alt="BuildLoop" className="h-6 w-auto" />
        </motion.div>

        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full flex items-center ring-1 ring-black/[0.02]"
        >
          <SignedIn>
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-full transition-all"
            >
              <Menu className="w-5 h-5 text-gray-700" />
              <img 
                src={user?.imageUrl} 
                alt="" 
                className="w-7 h-7 rounded-full border border-gray-200 shadow-sm"
              />
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-[#1a1d23] hover:bg-black text-white rounded-full text-xs font-semibold transition-all shadow-md">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </motion.div>
      </header>

      {/* Mobile Project Selector - Below md only */}
      <div className="fixed top-[72px] left-4 right-4 z-40 flex md:hidden">
        <SignedIn>
          {!mobileCreateOpen ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileCreateOpen(true)}
                className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full hover:bg-white hover:shadow-md transition-all active:scale-[0.98]"
              >
                <FolderKanban className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                  {activeProject?.name || 'Select Project'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              </button>
              <button
                onClick={() => setMobileCreateOpen(true)}
                className="p-2.5 bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full hover:bg-white hover:shadow-md transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 text-brand" />
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl"
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
                <FolderKanban className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900">New Project</span>
              </div>
              <div className="p-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      createMutation.mutate(newProjectName);
                    }
                  }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setMobileCreateOpen(false);
                      setNewProjectName('');
                    }}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => newProjectName.trim() && createMutation.mutate(newProjectName)}
                    disabled={createMutation.isPending || !newProjectName.trim()}
                    className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1a1d23] hover:bg-black rounded-xl transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </SignedIn>
      </div>

      {/* Mobile Bottom Drawer - Floating App Style */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] md:hidden"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.7 }}
              className="fixed bottom-6 left-4 right-4 z-[70] md:hidden"
            >
              <div className="bg-white/95 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-3xl px-3 py-4">
                {/* Close button */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 px-2 pb-3 mb-3 border-b border-gray-100">
                  <img 
                    src={user?.imageUrl} 
                    alt="" 
                    className="w-9 h-9 rounded-full border border-gray-200 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>

                {/* Floating App Drawer - Icon Grid */}
                <div className="grid grid-cols-6 gap-1">
                  {NAV_ITEMS.map((item, index) => (
                    <NavLink
                      key={item.name}
                      to={item.route}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="relative flex flex-col items-center py-2 group"
                    >
                      {({ isActive }) => (
                        <>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05, type: "spring", bounce: 0.4 }}
                            className={`
                              relative p-2 rounded-2xl transition-all duration-300
                              ${isActive 
                                ? 'bg-[#1a1d23] text-white shadow-lg shadow-black/20' 
                                : 'text-gray-500 hover:bg-gray-100'
                              }
                            `}
                          >
                            <item.icon className="w-5 h-5" />
                          </motion.div>
                          
                          <AnimatePresence mode="wait">
                            {isActive && (
                              <motion.span
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2 }}
                                className="text-[10px] font-medium text-gray-900 mt-1.5 truncate max-w-full px-0.5"
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>

                {/* Sign Out */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      signOut({ redirectUrl: '/' });
                      setMobileDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 text-red-500 hover:bg-red-50 rounded-2xl transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

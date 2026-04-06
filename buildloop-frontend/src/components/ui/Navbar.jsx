import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, SignInButton, useUser, useClerk } from '@clerk/clerk-react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Lightbulb, 
  ListChecks, 
  KanbanSquare, 
  Code2,
  Bell,
  Moon,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { name: 'Dashboard', route: '/', icon: LayoutDashboard },
  { name: 'Feedback', route: '/feedback', icon: MessageSquare },
  { name: 'Insights', route: '/insights', icon: Lightbulb },
  { name: 'Features', route: '/features', icon: ListChecks },
  { name: 'Kanban', route: '/kanban', icon: KanbanSquare },
  { name: 'Workspace', route: '/workspace', icon: Code2 },
];

export default function Navbar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6">
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl h-16 bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full flex items-center justify-between px-4 ring-1 ring-black/[0.02]"
      >
        
        {/* Left Side: Nav Links */}
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

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all relative group">
            <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Admin Tag / Button */}
          <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-100 transition-all">
            <span>Admin</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </button>

          {/* Theme Toggle placeholder */}
          <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all border border-gray-100">
            <Moon className="w-5 h-5" />
          </button>

          {/* Auth */}
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
                  <div className="hidden md:block text-left">
                    <p className="text-[13px] font-semibold text-gray-900 leading-none">{user?.firstName || 'User'}</p>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5 max-w-[100px] truncate leading-none">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
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
  );
}

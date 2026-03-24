import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Lightbulb, 
  ListChecks, 
  KanbanSquare, 
  Code2,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import useUIStore from '@/store/uiStore';

const NAV_ITEMS = [
  { name: 'Dashboard', route: '/', icon: LayoutDashboard },
  { name: 'Feedback', route: '/feedback', icon: MessageSquare },
  { name: 'Insights', route: '/insights', icon: Lightbulb },
  { name: 'Features', route: '/features', icon: ListChecks },
  { name: 'Kanban', route: '/kanban', icon: KanbanSquare },
  { name: 'Workspace', route: '/workspace', icon: Code2 },
];

export function Sidebar() {
  const { activeDrawer, openDrawer, closeDrawer } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const isMobileOpen = activeDrawer === 'mobile-sidebar';

  // Automatically adapt to screen dimension changes
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change for mobile users
  useEffect(() => {
    if (isMobileOpen) {
      closeDrawer();
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (isMobileOpen) closeDrawer();
    else openDrawer('mobile-sidebar');
  };

  const renderNavLinks = () => (
    <nav className="flex-1 flex flex-col gap-[6px] px-3 mt-6">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.route}
            className={({ isActive }) =>
              `group relative flex items-center justify-between px-3 py-3 rounded-lg font-medium transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${
                isActive
                  ? 'bg-brand/20 text-brand-light border-l-2 border-brand-light rounded-l-none pl-4 shadow-[inset_0px_1px_rgba(255,255,255,0.05)]'
                  : 'text-white/55 hover:bg-white/[.06] hover:text-white/85 border-l-2 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active glow accent */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-brand/10 to-transparent pointer-events-none" />
                )}
                
                <div className="flex items-center gap-3 relative z-10 w-full">
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:-rotate-3'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="tracking-wide text-[15px] leading-none mb-[2px]">{item.name}</span>
                </div>
                
                {/* Subtle active chevron */}
                {isActive && (
                  <ChevronRight className="w-4 h-4 opacity-50 relative z-10 mr-1" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeDrawer}
        />
      )}

      {/* Sidebar Shell - Premium Floating Look on Mobile, Fixed on Desktop */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 bg-sidebar flex flex-col flex-shrink-0
        border-r border-white/[.04] shadow-2xl lg:shadow-none
        transform transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Desktop Header */}
        <div className="hidden lg:flex h-20 items-center px-6 border-b border-white/[.04]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg shadow-brand/20 border border-white/10">
               <Code2 className="w-4 h-4 text-white drop-shadow-md" />
            </div>
            <div className="font-bold text-xl tracking-[0.2em] text-surface">
              BUILDLOOP
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Header */}
        <div className="flex lg:hidden h-16 items-center px-6 border-b border-white/[.04]">
          <span className="text-white/50 text-xs font-semibold tracking-widest uppercase">Navigation</span>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2">
           {renderNavLinks()}
        </div>

        {/* User / Settings Profile Footer */}
        <div className="p-4 border-t border-white/[.04] bg-gradient-to-t from-black/20 to-transparent">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[.06] cursor-pointer transition-colors text-white/70 hover:text-white group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-brand to-brand-dark flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg shadow-brand/10 transition-transform group-hover:scale-105">
              <span className="text-sm font-bold text-white tracking-wider">JS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate text-surface">Jagjeevan Singh</p>
              <p className="text-[11px] truncate text-brand-light/60 font-mono tracking-wide uppercase mt-0.5">Admin Role</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

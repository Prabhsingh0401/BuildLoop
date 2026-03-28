import { useLocation } from 'react-router-dom';
import { Menu, Code2 } from 'lucide-react';
import useUIStore from '@/store/uiStore';

export default function Topbar() {
  const { pathname } = useLocation();
  const { openDrawer } = useUIStore();
  
  const title = pathname === '/' ? 'Dashboard' : pathname.replace('/', '');

  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-surface/90 backdrop-blur-xl border-b border-border flex items-center px-4 lg:px-8 z-30">
      <div className="flex lg:hidden items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg shadow-brand/20 border border-white/10">
          <Code2 className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <h1 className="capitalize text-ink font-semibold text-[15px] tracking-wide ml-3 lg:ml-0">
        {title}
      </h1>
      
      <button 
        onClick={() => openDrawer('mobile-sidebar')}
        className="lg:hidden text-ink-3 hover:text-ink p-2 rounded-lg hover:bg-black/5 transition-colors ml-auto active:scale-95"
      >
        <Menu className="w-5 h-5" />
      </button>
    </header>
  );
}

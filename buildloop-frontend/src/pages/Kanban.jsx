import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, ListFilter, Search, ArrowRight, Grid2X2 } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import useUIStore from '@/store/uiStore.js';
import KanbanBoard from '@/components/kanban/KanbanBoard.jsx';
import CreateTaskModal from '@/components/kanban/CreateTaskModal.jsx';

const CARD_BASE = 'bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/* ─── Auth Guard view ────────────────────────────────────────── */
function AuthGuard() {
  return (
    <div className="relative min-h-[calc(100vh-200px)] flex flex-col items-center justify-center py-10 px-4">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className={`${CARD_BASE} max-w-md w-full p-10 text-center flex flex-col items-center gap-6`}
      >
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-ink">Private Board</h2>
          <p className="text-sm text-ink-3 leading-relaxed">
            Please sign in to access your Kanban board and manage tasks.
          </p>
        </div>
        <SignInButton mode="modal">
          <button className="w-full py-3.5 bg-ink hover:bg-black text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95">
            Sign in to BuildLoop
          </button>
        </SignInButton>
      </motion.div>
    </div>
  );
}

/* ─── Main Content ───────────────────────────────────────────── */
function KanbanContent() {
  const { openModal } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="z-10 w-full max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[22px] font-semibold text-ink leading-tight">Kanban</h1>
            <p className="text-sm text-ink-3 mt-0.5">
              The continuum of development
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className={`${CARD_BASE} flex items-center px-4 h-11 w-full sm:w-64 group focus-within:border-white/60 transition-all`}>
            <Search size={16} className="text-ink-3 group-focus-within:text-ink transition-colors" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm text-ink placeholder:text-ink-3/50 w-full ml-3 focus:outline-none focus:ring-0"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal('createTask')}
            className="h-11 px-5 rounded-full bg-[#1a1d23] text-white font-semibold text-sm flex items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            New Task
          </motion.button>
        </div>
      </motion.div>

      {/* ── Board Container ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-h-[calc(100vh-280px)] p-1 relative overflow-hidden"
      >
        <KanbanBoard searchQuery={searchQuery} />
      </motion.div>

      <CreateTaskModal />
    </div>
  );
}

/* ─── Main Page Export ───────────────────────────────────────── */
export default function Kanban() {
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col py-10 px-4">
      {/* Grid background */}
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 pointer-events-none"
      />

      <SignedIn>
        <KanbanContent />
      </SignedIn>

      <SignedOut>
        <AuthGuard />
      </SignedOut>
    </div>
  );
}

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, RefreshCcw } from 'lucide-react';

export default function TaskFiltersSheet({ isOpen, onClose, filters, setFilters, teamMembers = [] }) {
  const handleApply = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ assignee: 'all', date: 'all' });
  };

  // Prevent background scrolling when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[400px] md:rounded-3xl border border-white/40 bg-white/80 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.1)] flex flex-col max-h-[85vh]"
          >
            {/* Handle for mobile pull-down (visual only) */}
            <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-12 h-1.5 bg-black/10 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/40">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <div className="flex items-center gap-2">
                {(filters.assignee !== 'all' || filters.date !== 'all') && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors px-2 py-1"
                  >
                    <RefreshCcw size={12} />
                    Reset
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Assignee Filter */}
              <div className="space-y-3">
                <h3 className="text-[12px] font-bold text-ink-3/70 uppercase tracking-wider flex items-center gap-2">
                  <User size={14} />
                  Assignee
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <FilterChip
                    label="Everyone"
                    active={filters.assignee === 'all'}
                    onClick={() => handleApply('assignee', 'all')}
                  />
                  <FilterChip
                    label="Unassigned"
                    active={filters.assignee === 'unassigned'}
                    onClick={() => handleApply('assignee', 'unassigned')}
                  />
                  {teamMembers.map(member => (
                    <FilterChip
                      key={member._id}
                      label={member.name || member.email}
                      active={filters.assignee === (member.name || member.email)}
                      onClick={() => handleApply('assignee', member.name || member.email)}
                    />
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div className="space-y-3">
                <h3 className="text-[12px] font-bold text-ink-3/70 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={14} />
                  Created Date
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <FilterChip
                    label="Any time"
                    active={filters.date === 'all'}
                    onClick={() => handleApply('date', 'all')}
                  />
                  <FilterChip
                    label="Today"
                    active={filters.date === 'today'}
                    onClick={() => handleApply('date', 'today')}
                  />
                  <FilterChip
                    label="Past 7 Days"
                    active={filters.date === 'this-week'}
                    onClick={() => handleApply('date', 'this-week')}
                  />
                  <FilterChip
                    label="This Month"
                    active={filters.date === 'this-month'}
                    onClick={() => handleApply('date', 'this-month')}
                  />
                  <FilterChip
                    label="Past 3 Months"
                    active={filters.date === 'last-3-months'}
                    onClick={() => handleApply('date', 'last-3-months')}
                  />
                  <FilterChip
                    label="This Year"
                    active={filters.date === 'this-year'}
                    onClick={() => handleApply('date', 'this-year')}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/40 bg-white/30 rounded-b-3xl">
              <button
                onClick={onClose}
                className="w-full py-3 bg-ink hover:bg-black text-white font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Show Results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all text-left truncate border ${
        active
          ? 'bg-ink text-white border-ink shadow-sm'
          : 'bg-white/40 text-ink-3 border-white/40 hover:bg-white/60 hover:border-white/60'
      }`}
    >
      {label}
    </button>
  );
}

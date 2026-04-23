import { useState } from 'react';
import { Loader2, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import PriorityBadge from './PriorityBadge.jsx';

const tagStyles = 'px-2 py-0.5 rounded-pill text-[10px] font-semibold border bg-ink/5 text-ink-2 border-ink/10 uppercase';

const statusStyles = {
  backlog:     'bg-ink/5 text-ink-3 border-ink/10',
  todo:        'bg-ink/5 text-ink-3 border-ink/10',
  in_progress: 'bg-brand/10 text-brand border-brand/20',
  done:        'bg-success/10 text-success border-success/20',
};

const statusLabels = {
  backlog:     'Backlog',
  todo:        'Todo',
  in_progress: 'In Progress',
  done:        'Done',
};

const CARD_BASE = 'bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

export default function FeatureTable({ features, onRowClick, onPromote }) {
  const [promotingId, setPromotingId] = useState(null);

  const handlePromote = async (e, feature) => {
    e.stopPropagation();
    if (!onPromote || promotingId || feature.isPromoted) return;

    setPromotingId(feature._id);
    try {
      await onPromote(feature);
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {features.map((feature, index) => (
          <FeatureCard 
            key={feature._id} 
            feature={feature} 
            onPromote={handlePromote} 
            isPromoting={promotingId === feature._id} 
            index={index}
          />
        ))}
      </div>

      {/* Desktop View */}
      <div className={`hidden md:block ${CARD_BASE} overflow-hidden`}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/20 bg-white/20">
              <th className="text-left px-6 py-4 text-[10px] font-bold text-ink-3 uppercase tracking-wider">Feature</th>
              <th className="text-left px-4 py-4 text-[10px] font-bold text-ink-3 uppercase tracking-wider">Priority</th>
              <th className="text-left px-4 py-4 text-[10px] font-bold text-ink-3 uppercase tracking-wider">Effort</th>
              <th className="text-left px-4 py-4 text-[10px] font-bold text-ink-3 uppercase tracking-wider">Impact</th>
              <th className="text-left px-4 py-4 text-[10px] font-bold text-ink-3 uppercase tracking-wider">Status</th>
              {onPromote && (
                <th className="text-right px-6 py-4 text-[10px] font-bold text-ink-3 uppercase tracking-wider">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {features.map((feature, index) => {
              const isPromoting = promotingId === feature._id;
              const isPromoted  = feature.isPromoted;

              return (
                <motion.tr
                  key={feature._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`group transition-colors ${isPromoted ? 'opacity-40' : 'hover:bg-white/40'}`}
                >
                  <td className="px-6 py-4 font-medium text-ink">{feature.title}</td>
                  <td className="px-4 py-4">
                    <PriorityBadge score={feature.priorityScore} />
                  </td>
                  <td className="px-4 py-4">
                    <span className={tagStyles}>{feature.effort}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={tagStyles}>{feature.impact}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-pill text-[10px] font-semibold border ${statusStyles[feature.status] || 'bg-ink/5'}`}>
                      {statusLabels[feature.status] || feature.status}
                    </span>
                  </td>
                  {onPromote && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => handlePromote(e, feature)}
                        disabled={isPromoting || isPromoted}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all
                          ${isPromoted
                            ? 'text-success'
                            : isPromoting
                            ? 'text-ink-3'
                            : 'bg-ink text-white hover:bg-black'}
                        `}
                      >
                        {isPromoting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : isPromoted ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Zap size={10} fill="currentColor" />
                        )}
                        {isPromoted ? 'Sent' : isPromoting ? 'Sending…' : 'Send to Kanban'}
                      </button>
                    </td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeatureCard({ feature, onPromote, isPromoting, index }) {
  const isPromoted = feature.isPromoted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 ${CARD_BASE} ${isPromoted ? 'opacity-40' : ''}`}
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <h3 className="font-semibold text-ink text-sm leading-tight flex-1">{feature.title}</h3>
        <div className="flex-shrink-0">
          <PriorityBadge score={feature.priorityScore} />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <span className={tagStyles}>Effort: {feature.effort}</span>
        <span className={tagStyles}>Impact: {feature.impact}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="text-[10px] font-semibold text-ink-3 uppercase">
          {statusLabels[feature.status] || feature.status}
        </span>

        {onPromote && (
          <button
            onClick={(e) => onPromote(e, feature)}
            disabled={isPromoting || isPromoted}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
              ${isPromoted ? 'text-success' : isPromoting ? 'text-ink-3' : 'bg-ink text-white'}
            `}
          >
            {isPromoting ? <Loader2 size={12} className="animate-spin" /> : isPromoted ? <CheckCircle2 size={12} /> : null}
            {isPromoted ? 'Sent' : isPromoting ? 'Sending…' : 'Send to Kanban'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

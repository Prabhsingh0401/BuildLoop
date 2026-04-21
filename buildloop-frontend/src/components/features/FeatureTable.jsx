import { useState } from 'react';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';

const effortStyles = {
  high:   'bg-danger-light text-danger',
  medium: 'bg-warn-light text-warn',
  low:    'bg-success-light text-success',
};

const statusStyles = {
  backlog:     'bg-bg text-ink-2',
  todo:        'bg-bg text-ink-2',
  in_progress: 'bg-brand-light text-brand',
  done:        'bg-success-light text-success',
};

const statusLabels = {
  backlog:     'Backlog',
  todo:        'Todo',
  in_progress: 'In Progress',
  done:        'Done',
};

export default function FeatureTable({ features, onRowClick, onPromote }) {
  const [promotingId, setPromotingId] = useState(null);

  if (!features || features.length === 0) {
    return (
      <div className="text-center py-12 text-ink-3 text-sm">
        No features yet. Run prioritisation to generate features.
      </div>
    );
  }

  const handlePromote = async (e, feature) => {
    e.stopPropagation();
    if (promotingId || feature.isPromoted) return;

    setPromotingId(feature._id);
    try {
      await onPromote(feature);
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg">
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink-3 uppercase tracking-wide w-[35%]">
              Title
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink-3 uppercase tracking-wide">
              Priority
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink-3 uppercase tracking-wide">
              Effort
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink-3 uppercase tracking-wide">
              Impact
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink-3 uppercase tracking-wide">
              Status
            </th>
            <th className="text-right px-4 py-3 text-[11px] font-semibold text-ink-3 uppercase tracking-wide">
              Kanban
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => {
            const isPromoting = promotingId === feature._id;
            const isPromoted  = feature.isPromoted;

            return (
              <tr
                key={feature._id}
                onClick={() => !isPromoted && onRowClick(feature)}
                className={[
                  'transition-all duration-300',
                  isPromoted ? 'grayscale opacity-70 cursor-default bg-bg/50' : 'cursor-pointer hover:bg-brand-light/30',
                  index !== features.length - 1 ? 'border-b border-border' : '',
                ].join(' ')}
              >
                {/* Title */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink truncate block max-w-[260px]">
                      {feature.title}
                    </span>
                    {feature.priorityRationale && (
                      <span className="text-[12px] text-ink-3 truncate block max-w-[260px] mt-0.5">
                        {feature.priorityRationale}
                      </span>
                    )}
                  </div>
                </td>

                {/* Priority */}
                <td className="px-4 py-3">
                  <PriorityBadge score={feature.priorityScore} />
                </td>

                {/* Effort */}
                <td className="px-4 py-3">
                  <span
                    className={`${effortStyles[feature.effort] ?? 'bg-bg text-ink-2'}
                                text-[11px] font-semibold px-2 py-0.5
                                rounded-pill capitalize`}
                  >
                    {feature.effort}
                  </span>
                </td>

                {/* Impact */}
                <td className="px-4 py-3">
                  <span
                    className={`${effortStyles[feature.impact] ?? 'bg-bg text-ink-2'}
                                text-[11px] font-semibold px-2 py-0.5
                                rounded-pill capitalize`}
                  >
                    {feature.impact}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`${statusStyles[feature.status] ?? 'bg-bg text-ink-2'}
                                text-[11px] font-semibold px-2 py-0.5
                                rounded-pill`}
                  >
                    {statusLabels[feature.status] ?? feature.status}
                  </span>
                </td>

                {/* Promote to Kanban */}
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => handlePromote(e, feature)}
                    disabled={isPromoting || isPromoted}
                    title={isPromoted ? 'Already on Kanban' : 'Add to Kanban as task'}
                    className={[
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[11px] font-semibold transition-all',
                      isPromoted
                        ? 'bg-success-light text-success cursor-default shadow-sm'
                        : isPromoting
                        ? 'bg-bg text-ink-3 cursor-not-allowed'
                        : 'bg-brand-light text-brand hover:bg-brand hover:text-white active:scale-95',
                    ].join(' ')}
                  >
                    {isPromoting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : isPromoted ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <ArrowRight size={12} />
                    )}
                    {isPromoted ? 'In Kanban' : isPromoting ? 'Adding…' : 'Add to Kanban'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

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

export default function FeatureTable({ features, onRowClick }) {
  if (!features || features.length === 0) {
    return (
      <div className="text-center py-12 text-ink-3 text-sm">
        No features yet. Run prioritisation to generate features.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-card
                    overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg">
            <th className="text-left px-4 py-3 text-[11px] font-semibold
                           text-ink-3 uppercase tracking-wide w-[40%]">
              Title
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold
                           text-ink-3 uppercase tracking-wide">
              Priority
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold
                           text-ink-3 uppercase tracking-wide">
              Effort
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold
                           text-ink-3 uppercase tracking-wide">
              Impact
            </th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold
                           text-ink-3 uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr
              key={feature._id}
              onClick={() => onRowClick(feature)}
              className={[
                'cursor-pointer transition-colors',
                'hover:bg-brand-light/30',
                index !== features.length - 1
                  ? 'border-b border-border'
                  : '',
              ].join(' ')}
            >
              {/* Title */}
              <td className="px-4 py-3">
                <span className="font-semibold text-ink truncate
                                 block max-w-[280px]">
                  {feature.title}
                </span>
                {feature.priorityRationale && (
                  <span className="text-[12px] text-ink-3 truncate
                                   block max-w-[280px] mt-0.5">
                    {feature.priorityRationale}
                  </span>
                )}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { ChevronRight } from 'lucide-react';

export default function TaskCard({
  task,
  featureName,
  onStatusMove,
  onClick,
}) {
  const nextStatus = {
    todo:        'in_progress',
    in_progress: 'done',
    done:        null,
  }[task.status];

  return (
    <div
      className="bg-surface border border-border rounded-card
                 p-3 flex flex-col gap-1.5 max-h-[100px]
                 overflow-hidden cursor-pointer
                 hover:shadow-sm transition-shadow"
      onClick={onClick}
    >
      {/* Title */}
      <p className="text-sm font-semibold text-ink leading-snug line-clamp-2">
        {task.title}
      </p>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-brand-light text-brand text-[11px]
                         font-semibold px-2 py-0.5 rounded-pill"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: feature name + move button */}
      <div className="flex items-center justify-between mt-auto">
        {featureName ? (
          <span className="text-[12px] text-ink-3 truncate max-w-[140px]">
            {featureName}
          </span>
        ) : (
          <span />
        )}

        {nextStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent card onClick firing
              onStatusMove(task._id, nextStatus);
            }}
            className="text-ink-3 hover:text-brand transition-colors
                       flex-shrink-0"
            title={`Move to ${nextStatus.replace('_', ' ')}`}
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
